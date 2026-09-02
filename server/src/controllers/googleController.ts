import type { Request, Response } from 'express';
import { GoogleConnectionModel } from '../models/GoogleConnection';
import { beginGoogleOAuth, completeGoogleOAuth, recordGoogleAuthorizationError, sanitizeGoogleError } from '../services/googleOAuthService';
import { listSearchConsoleProperties, querySearchConsole } from '../services/searchConsoleService';
import { listGa4Properties, runGa4Report } from '../services/ga4Service';
import { resolveGoogleDateRange } from '../services/googleDateRange';
import { getGa4Dashboard } from '../services/ga4DashboardService';

const frontendUrl = () => process.env.FRONTEND_URL ?? 'http://localhost:5174';
const adminId = (req: Request) => req.admin!.id;

async function connectionFor(req: Request) {
  return GoogleConnectionModel.findOne({ adminId: adminId(req) });
}

export async function startGoogleOAuth(req: Request, res: Response) {
  try { res.redirect(await beginGoogleOAuth(adminId(req))); } catch (error) { res.status(503).json({ message: error instanceof Error ? error.message : 'Google OAuth is not configured' }); }
}

export async function googleOAuthCallback(req: Request, res: Response) {
  try {
    if (!req.query.state || !req.query.code) throw new Error(req.query.error ? 'Google authorization was denied' : 'Google authorization response was incomplete');
    await completeGoogleOAuth(String(req.query.state), String(req.query.code));
    res.redirect(`${frontendUrl()}/#/admin?google=connected`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google authorization failed';
    res.redirect(`${frontendUrl()}/#/admin?google=error&message=${encodeURIComponent(message)}`);
  }
}

export async function getGoogleStatus(req: Request, res: Response) {
  const connection = await connectionFor(req);
  res.json({ connected: connection?.status === 'connected' && Boolean(connection.refreshTokenEncrypted), googleAccount: connection?.googleEmail ? { email: connection.googleEmail } : null, selectedGscProperty: connection?.selectedGscProperty ?? null, selectedGa4Property: connection?.selectedGa4Property ?? null, status: connection?.status ?? 'disconnected', lastError: connection?.lastError ?? null });
}

export async function disconnectGoogle(req: Request, res: Response) {
  await GoogleConnectionModel.findOneAndUpdate({ adminId: adminId(req) }, { $set: { status: 'disconnected', googleSubject: undefined, googleEmail: undefined, refreshTokenEncrypted: undefined, accessTokenEncrypted: undefined, accessTokenExpiresAt: undefined, scopes: [], selectedGscProperty: undefined, selectedGa4Property: undefined, lastError: undefined } });
  res.status(204).send();
}

export async function saveGoogleSelection(req: Request, res: Response) {
  const update: Record<string, string> = {};
  if (typeof req.body.gscProperty === 'string') update.selectedGscProperty = req.body.gscProperty;
  if (typeof req.body.ga4Property === 'string') update.selectedGa4Property = req.body.ga4Property;
  const connection = await GoogleConnectionModel.findOneAndUpdate({ adminId: adminId(req) }, { $set: update }, { new: true });
  if (!connection) return res.status(404).json({ message: 'Google is not connected' });
  res.json({ selectedGscProperty: connection.selectedGscProperty ?? null, selectedGa4Property: connection.selectedGa4Property ?? null });
}

export async function getGscProperties(req: Request, res: Response) { try { const c = await connectionFor(req); console.log(`[ShopSense Google] GET /google/search-console/properties admin=${adminId(req)} account=${c?.googleEmail ?? 'none'}`); if (!c) return res.status(400).json({ message: 'Connect Google first' }); const properties = await listSearchConsoleProperties(c); console.log(`[ShopSense Google] Search Console properties returned=${properties.length}`); res.json(properties); } catch (e) { await recordGoogleAuthorizationError(adminId(req), e); res.status(502).json({ message: sanitizeGoogleError(e) }); } }
export async function getGscReport(req: Request, res: Response) { try { const c = await connectionFor(req); if (!c?.selectedGscProperty) return res.status(400).json({ message: 'Select a Search Console property first' }); const dateRange = resolveGoogleDateRange(req.query); const dimensions = String(req.query.dimensions ?? 'date').split(',').filter(Boolean); res.json({ rows: await querySearchConsole(c, c.selectedGscProperty, dateRange, dimensions), property: c.selectedGscProperty, dateRange }); } catch (e) { await recordGoogleAuthorizationError(adminId(req), e); res.status(502).json({ message: e instanceof Error && e.message.startsWith('Invalid ') ? e.message : sanitizeGoogleError(e) }); } }
export async function getGa4Properties(req: Request, res: Response) { try { const c = await connectionFor(req); console.log(`[ShopSense Google] GET /google/analytics/properties admin=${adminId(req)} account=${c?.googleEmail ?? 'none'}`); if (!c) return res.status(400).json({ message: 'Connect Google first' }); const properties = await listGa4Properties(c); console.log(`[ShopSense Google] GA4 properties returned=${properties.length}`); res.json(properties); } catch (e) { await recordGoogleAuthorizationError(adminId(req), e); res.status(502).json({ message: sanitizeGoogleError(e) }); } }
export async function getGa4Report(req: Request, res: Response) { try { const c = await connectionFor(req); if (!c?.selectedGa4Property) return res.status(400).json({ message: 'Select a GA4 property first' }); const dateRange = resolveGoogleDateRange(req.query); const dimensions = String(req.query.dimensions ?? 'date').split(',').filter(Boolean); const metrics = String(req.query.metrics ?? 'activeUsers,newUsers,sessions,engagementRate,averageSessionDuration,eventCount,conversions').split(',').filter(Boolean); res.json({ rows: await runGa4Report(c, c.selectedGa4Property, dateRange, dimensions, metrics), property: c.selectedGa4Property, dateRange }); } catch (e) { await recordGoogleAuthorizationError(adminId(req), e); res.status(502).json({ message: e instanceof Error && e.message.startsWith('Invalid ') ? e.message : sanitizeGoogleError(e) }); } }
export async function getGa4DashboardReport(req: Request, res: Response) { try { const c = await connectionFor(req); if (!c?.selectedGa4Property) return res.status(400).json({ message: 'Select a GA4 property first' }); const dateRange = resolveGoogleDateRange(req.query); res.json(await getGa4Dashboard(c, c.selectedGa4Property, dateRange)); } catch (e) { await recordGoogleAuthorizationError(adminId(req), e); res.status(502).json({ message: e instanceof Error && e.message.startsWith('Invalid ') ? e.message : sanitizeGoogleError(e) }); } }
