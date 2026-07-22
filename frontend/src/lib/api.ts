import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // The session is an httpOnly cookie, so the browser attaches it for us.
  // Nothing here can read it — which is the point.
  withCredentials: true,
});

/** Prefer the API's own message; fall back when the request never landed. */
export function apiError(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}
