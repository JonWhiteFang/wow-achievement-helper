import type { Env } from "./env";
import { fetchCategories, fetchAchievement } from "./blizzard/gameData";

function json(data: unknown, status = 200, cacheSeconds = 0): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheSeconds > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`;
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function err(code: string, message: string, status: number): Response {
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

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return withCors(req, env, async () => {
      const url = new URL(req.url);
      const path = url.pathname;

      if (path === "/healthz") {
        return json({ ok: true });
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

      return err("NOT_FOUND", "Route not found", 404);
    });
  },
};
