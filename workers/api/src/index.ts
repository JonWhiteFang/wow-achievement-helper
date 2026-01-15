import type { Env } from "./env";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function err(code: string, message: string, status: number): Response {
  return json({ error: code, message }, status);
}

function withCors(req: Request, env: Env, handler: () => Response | Promise<Response>): Response | Promise<Response> {
  const origin = req.headers.get("Origin");
  const allowed = origin === env.APP_ORIGIN;

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: allowed
        ? {
            "Access-Control-Allow-Origin": env.APP_ORIGIN,
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
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", env.APP_ORIGIN);
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return withCors(req, env, () => {
      const url = new URL(req.url);

      if (url.pathname === "/healthz") {
        return json({ ok: true });
      }

      return err("NOT_FOUND", "Route not found", 404);
    });
  },
};
