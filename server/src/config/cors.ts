import type { CorsOptions } from 'cors';

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://shopsens.netlify.app',
];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

function buildAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
  ].filter((origin): origin is string => Boolean(origin)).map(normalizeOrigin);

  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv.map(normalizeOrigin)])];
}

export function corsOptions(): CorsOptions {
  const allowedOrigins = buildAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  };
}
