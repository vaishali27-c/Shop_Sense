import crypto from 'crypto';
import { google } from 'googleapis';
import type mongoose from 'mongoose';
import { GoogleConnectionModel } from '../models/GoogleConnection';

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
];
const STATE_TTL_MS = 10 * 60 * 1000;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} configuration`);
  return value;
}

function encryptionKey(): Buffer {
  const configured = requiredEnv('GOOGLE_TOKEN_ENCRYPTION_KEY');
  return crypto.createHash('sha256').update(configured).digest();
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decrypt(value: string): string {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}

export function createOAuthClient() {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? (process.env.RENDER || process.env.NODE_ENV === 'production'
    ? 'https://shop-sense-6trn.onrender.com/api/google/oauth/callback'
    : 'http://localhost:10000/api/google/oauth/callback');
  return new google.auth.OAuth2(requiredEnv('GOOGLE_CLIENT_ID'), requiredEnv('GOOGLE_CLIENT_SECRET'), redirectUri);
}

export async function beginGoogleOAuth(adminId: string): Promise<string> {
  const state = crypto.randomBytes(32).toString('base64url');
  await GoogleConnectionModel.findOneAndUpdate(
    { adminId },
    { $set: { pendingStateHash: hashState(state), pendingStateExpiresAt: new Date(Date.now() + STATE_TTL_MS) }, $setOnInsert: { status: 'disconnected', scopes: [] } },
    { upsert: true },
  );
  return createOAuthClient().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: OAUTH_SCOPES, state });
}

function hashState(state: string): string {
  return crypto.createHash('sha256').update(state).digest('hex');
}

export async function completeGoogleOAuth(state: string, code: string): Promise<void> {
  const connection = await GoogleConnectionModel.findOne({ pendingStateHash: hashState(state), pendingStateExpiresAt: { $gt: new Date() } });
  if (!connection) throw new Error('Invalid or expired Google authorization state');

  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token && !connection.refreshTokenEncrypted) throw new Error('Google did not provide a refresh token. Disconnect and reconnect Google.');
  client.setCredentials(tokens);
  const profile = await google.oauth2({ version: 'v2', auth: client }).userinfo.get();
  const email = profile.data.email;
  if (!email) throw new Error('Google account email was not returned');

  connection.googleSubject = profile.data.id ?? undefined;
  connection.googleEmail = email;
  connection.refreshTokenEncrypted = tokens.refresh_token ? encrypt(tokens.refresh_token) : connection.refreshTokenEncrypted;
  connection.accessTokenEncrypted = tokens.access_token ? encrypt(tokens.access_token) : undefined;
  connection.accessTokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
  connection.scopes = tokens.scope?.split(' ') ?? OAUTH_SCOPES;
  connection.status = 'connected';
  connection.lastError = undefined;
  connection.pendingStateHash = undefined;
  connection.pendingStateExpiresAt = undefined;
  await connection.save();
}

type StoredConnection = { _id: mongoose.Types.ObjectId; refreshTokenEncrypted?: string; accessTokenEncrypted?: string; accessTokenExpiresAt?: Date };

export async function getAuthorizedClient(connection: StoredConnection): Promise<ReturnType<typeof createOAuthClient>> {
  if (!connection.refreshTokenEncrypted) throw new Error('Google is not connected');
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: decrypt(connection.refreshTokenEncrypted) });
  if (connection.accessTokenEncrypted && connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000) {
    client.setCredentials({ refresh_token: decrypt(connection.refreshTokenEncrypted), access_token: decrypt(connection.accessTokenEncrypted), expiry_date: connection.accessTokenExpiresAt.getTime() });
  }
  client.on('tokens', async (tokens) => {
    const update: Record<string, unknown> = {};
    if (tokens.access_token) update.accessTokenEncrypted = encrypt(tokens.access_token);
    if (tokens.expiry_date) update.accessTokenExpiresAt = new Date(tokens.expiry_date);
    if (tokens.refresh_token) update.refreshTokenEncrypted = encrypt(tokens.refresh_token);
    await GoogleConnectionModel.updateOne({ _id: connection._id }, { $set: update });
  });
  return client;
}

function googleErrorCode(error: unknown): string | undefined {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof responseData === 'string') return responseData;
  if (responseData && typeof responseData === 'object' && 'error' in responseData) {
    const code = responseData.error;
    if (typeof code === 'string') return code;
    if (code && typeof code === 'object' && 'status' in code) return String(code.status);
  }
  return undefined;
}

export function isGoogleAuthorizationError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403 || googleErrorCode(error) === 'invalid_grant';
}

export async function recordGoogleAuthorizationError(adminId: string, error: unknown): Promise<void> {
  if (!isGoogleAuthorizationError(error)) return;
  await GoogleConnectionModel.updateOne(
    { adminId },
    { $set: { status: 'error', lastError: 'Google authorization expired or was revoked. Reconnect Google.' } },
  );
}

export function sanitizeGoogleError(error: unknown): string {
  if (isGoogleAuthorizationError(error)) return 'Google authorization expired or was revoked. Reconnect Google.';
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 429) return 'Google API quota has been reached. Please try again later.';
  return 'Google API request failed. Check the selected property and try again.';
}

export function logGoogleApiError(apiName: string, error: unknown): void {
  const typedError = error as { message?: string; response?: { status?: number; statusText?: string; data?: { error?: { message?: string } } } };
  const responseError = typedError.response?.data?.error?.message;
  console.error(`[ShopSense Google] ${apiName} failed`, {
    status: typedError.response?.status,
    statusText: typedError.response?.statusText,
    message: responseError ?? typedError.message ?? 'Unknown Google API error',
  });
}
