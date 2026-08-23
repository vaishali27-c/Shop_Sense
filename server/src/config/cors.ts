import type { CorsOptions } from 'cors';

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://shopsens.netlify.app',
];

function buildAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ?? []),
  ].filter(Boolean) as string[];

  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
}

export function corsOptions(): CorsOptions {
  const allowedOrigins = buildAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  };
}
