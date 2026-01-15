import type { Env } from "./env";

export type SessionData = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  battletag?: string;
};

type PendingAuth = {
  codeVerifier: string;
  createdAt: number;
};

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const PENDING_TTL = 60 * 10; // 10 minutes

export function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function storePendingAuth(env: Env, state: string, codeVerifier: string): Promise<void> {
  const data: PendingAuth = { codeVerifier, createdAt: Date.now() };
  await env.SESSIONS.put(`pending:${state}`, JSON.stringify(data), { expirationTtl: PENDING_TTL });
}

export async function getPendingAuth(env: Env, state: string): Promise<string | null> {
  const raw = await env.SESSIONS.get(`pending:${state}`);
  if (!raw) return null;
  await env.SESSIONS.delete(`pending:${state}`);
  const data = JSON.parse(raw) as PendingAuth;
  return data.codeVerifier;
}

export async function createSession(env: Env, data: SessionData): Promise<string> {
  const sessionId = generateRandomString(32);
  await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(data), { expirationTtl: SESSION_TTL });
  return sessionId;
}

export async function getSession(env: Env, sessionId: string): Promise<SessionData | null> {
  const raw = await env.SESSIONS.get(`session:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteSession(env: Env, sessionId: string): Promise<void> {
  await env.SESSIONS.delete(`session:${sessionId}`);
}

export function getSessionIdFromCookie(req: Request): string | null {
  const cookie = req.headers.get("Cookie") || "";
  const match = cookie.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}

export function sessionCookie(sessionId: string, maxAge: number): string {
  return `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
