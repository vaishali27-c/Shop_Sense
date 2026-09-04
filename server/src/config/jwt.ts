const JWT_SECRET_NAMES = ['JWT_USER_SECRET', 'JWT_ADMIN_SECRET'] as const;

export type JwtSecretName = (typeof JWT_SECRET_NAMES)[number];

export function requireJwtSecret(name: JwtSecretName): string {
  const secret = process.env[name]?.trim();
  if (!secret) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return secret;
}

export function assertJwtSecretsConfigured(): void {
  for (const name of JWT_SECRET_NAMES) requireJwtSecret(name);
}