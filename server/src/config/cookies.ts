import type { CookieOptions } from 'express';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
}

function baseAuthCookieOptions(): CookieOptions {
  const production = isProduction();

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
  };
}

export function authCookieOptions(): CookieOptions {
  return {
    ...baseAuthCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function clearAuthCookieOptions(): CookieOptions {
  return baseAuthCookieOptions();
}
