import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE = 'tenantly_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: SEVEN_DAYS_MS,
  path: '/',
});

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, cookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });
}
