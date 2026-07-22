import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE = 'tenantly_token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The JWT lives in an httpOnly cookie so client-side script can never read it:
 * an XSS bug then cannot exfiltrate a token that stays valid for a week.
 *
 * SameSite=Lax is what keeps CSRF away here. The browser treats
 * localhost:3000 -> localhost:3001 (and app.x.com -> api.x.com) as same-site
 * because ports and subdomains do not change the site, while a genuinely
 * cross-site POST never carries the cookie at all.
 */
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
