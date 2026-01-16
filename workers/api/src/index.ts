import type { Env } from "./env";
import { fetchCategories, fetchAchievement, fetchRealms } from "./blizzard/gameData";
import { getManifest, buildManifestIncremental } from "./blizzard/manifest";
import { fetchCharacterAchievements } from "./blizzard/character";
import { fetchUserCharacters } from "./blizzard/profile";
import { handleLogin, handleCallback, handleMe, handleLogout } from "./authHandlers";
import { getSessionIdFromCookie, getSession } from "./auth/session";
import { mergeCharacterAchievements, type MergeRequest } from "./merge";
import { fetchHelp } from "./help";

function log(req: Request, status: number, start: number): void {
  const duration = Date.now() - start;
  const url = new URL(req.url);
  console.log(`${req.method} ${url.pathname} ${status} ${duration}ms`);
}

function json(data: unknown, status = 200, cacheSeconds = 0): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheSeconds > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`;
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function err(code: string, message: string, status: number): Response {
  // Log errors for monitoring (can be picked up by Cloudflare analytics or external logging)
  if (status >= 500) {
    console.error(`[ERROR] ${code}: ${message}`);
  }
  return json({ error: code, message }, status);
}

function withCors(req: Request, env: Env, handler: () => Response | Promise<Response>): Response | Promise<Response> {
  const origin = req.headers.get("Origin");
  // APP_ORIGIN includes path, but Origin header is just the origin
  const allowedOrigin = new URL(env.APP_ORIGIN).origin;
  const allowed = origin === allowedOrigin;

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: allowed
        ? {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          }
        : {},
    });
  }

  const response = handler();
  return response instanceof Promise
    ? response.then((r) => addCorsHeaders(r, env, allowed))
    : addCorsHeaders(response, env, allowed);
}

function addCorsHeaders(res: Response, env: Env, allowed: boolean): Response {
  if (!allowed) return res;
  const allowedOrigin = new URL(env.APP_ORIGIN).origin;
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(res.body, { status: res.status, headers });
}

const CACHE_24H = 86400;
const CACHE_1H = 3600;
const CACHE_5M = 300;
const CACHE_12H = 43200;

const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const start = Date.now();
    const response = await withCors(req, env, async () => {
      const url = new URL(req.url);
      const path = url.pathname;

      if (path === "/healthz") {
        return json({ ok: true });
      }

      // Auth routes (no CORS needed for redirects, but /auth/me and /auth/logout need it)
      if (path === "/auth/login") {
        return handleLogin(req, env);
      }
      if (path === "/auth/callback") {
        return handleCallback(req, env);
      }
      if (path === "/auth/me") {
        return handleMe(req, env);
      }
      if (path === "/auth/logout" && req.method === "POST") {
        return handleLogout(req, env);
      }

      if (path === "/api/manifest") {
        try {
          const manifest = await getManifest(env);
          if (!manifest) {
            return err("NOT_READY", "Manifest is being built, please try again later", 503);
          }
          return json(manifest, 200, CACHE_1H);
        } catch (e) {
          return err("BLIZZARD_ERROR", (e as Error).message, 502);
        }
      }

      // Admin endpoint to trigger manifest build (call multiple times until done)
      if (path === "/api/admin/build-manifest" && req.method === "POST") {
        try {
          const reset = url.searchParams.get("reset") === "true";
          if (reset) {
            await env.SESSIONS.delete("manifest:build-state");
            await env.SESSIONS.delete("manifest:v1");
            return json({ reset: true });
          }
          const result = await buildManifestIncremental(env);
          return json({ done: result.done, progress: result.progress });
        } catch (e) {
          return err("BUILD_ERROR", (e as Error).message, 500);
        }
      }

      if (path === "/api/realms") {
        try {
          const realms = await fetchRealms(env);
          return json({ realms }, 200, CACHE_1H);
        } catch (e) {
          return err("BLIZZARD_ERROR", (e as Error).message, 502);
        }
      }

      if (path === "/api/categories") {
        try {
          const data = await fetchCategories(env);
          return json({ categories: data.categories, achievements: data.achievements, generatedAt: new Date().toISOString() }, 200, CACHE_24H);
        } catch (e) {
          return err("BLIZZARD_ERROR", (e as Error).message, 502);
        }
      }

      const achievementMatch = path.match(/^\/api\/achievement\/(\d+)$/);
      if (achievementMatch) {
        try {
          const achievement = await fetchAchievement(env, parseInt(achievementMatch[1], 10));
          return json(achievement, 200, CACHE_24H);
        } catch (e) {
          return err("BLIZZARD_ERROR", (e as Error).message, 502);
        }
      }

      const helpMatch = path.match(/^\/api\/help\/achievement\/(\d+)$/);
      if (helpMatch) {
        const top = parseInt(url.searchParams.get("top") || "10", 10);
        try {
          const help = await fetchHelp(parseInt(helpMatch[1], 10), Math.min(top, 20));
          return json(help, 200, CACHE_12H);
        } catch (e) {
          return err("UPSTREAM_ERROR", (e as Error).message, 502);
        }
      }

      const charMatch = path.match(/^\/api\/character\/([^/]+)\/([^/]+)\/achievements$/);
      if (charMatch) {
        try {
          const data = await fetchCharacterAchievements(env, decodeURIComponent(charMatch[1]), decodeURIComponent(charMatch[2]));
          return json(data, 200, CACHE_5M);
        } catch (e: unknown) {
          const error = e as { code?: string; message?: string; status?: number };
          if (error.code && error.status) {
            return err(error.code, error.message || "Unknown error", error.status);
          }
          return err("UPSTREAM_ERROR", (e as Error).message, 502);
        }
      }

      if (path === "/api/me/characters") {
        const sessionId = getSessionIdFromCookie(req);
        if (!sessionId) return err("UNAUTHENTICATED", "Not logged in", 401);
        const session = await getSession(env, sessionId);
        if (!session) return err("UNAUTHENTICATED", "Session expired", 401);
        try {
          const characters = await fetchUserCharacters(env, session.accessToken);
          return json({ characters });
        } catch (e: unknown) {
          const error = e as { code?: string; message?: string; status?: number };
          if (error.code && error.status) {
            return err(error.code, error.message || "Unknown error", error.status);
          }
          return err("UPSTREAM_ERROR", (e as Error).message, 502);
        }
      }

      if (path === "/api/me/merge" && req.method === "POST") {
        const sessionId = getSessionIdFromCookie(req);
        if (!sessionId) return err("UNAUTHENTICATED", "Not logged in", 401);
        const session = await getSession(env, sessionId);
        if (!session) return err("UNAUTHENTICATED", "Session expired", 401);
        try {
          const body = (await req.json()) as MergeRequest;
          const result = await mergeCharacterAchievements(env, body.characters);
          return json(result);
        } catch (e: unknown) {
          const error = e as { code?: string; message?: string; status?: number };
          if (error.code && error.status) {
            return err(error.code, error.message || "Unknown error", error.status);
          }
          return err("UPSTREAM_ERROR", (e as Error).message, 502);
        }
      }

      return err("NOT_FOUND", "Route not found", 404);
    });
    log(req, response.status, start);
    return response;
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    // Run single iteration of manifest build
    const result = await buildManifestIncremental(env);
    console.log(`Manifest build: ${result.progress}`);
  },
};

export default worker;
