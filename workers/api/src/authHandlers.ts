import type { Env } from "./env";
import {
  generateRandomString,
  generateCodeChallenge,
  storePendingAuth,
  getPendingAuth,
  createSession,
  getSession,
  deleteSession,
  getSessionIdFromCookie,
  sessionCookie,
  type SessionData,
} from "./auth/session";

export async function handleLogin(req: Request, env: Env): Promise<Response> {
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  await storePendingAuth(env, state, codeVerifier);

  const params = new URLSearchParams({
    client_id: env.BNET_CLIENT_ID,
    redirect_uri: `${new URL(req.url).origin}/auth/callback`,
    response_type: "code",
    scope: "wow.profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return Response.redirect(`${env.BATTLE_NET_OAUTH_AUTHORIZE}?${params}`, 302);
}

export async function handleCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${env.APP_ORIGIN}/#/login-error?error=${error}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${env.APP_ORIGIN}/#/login-error?error=missing_params`, 302);
  }

  const codeVerifier = await getPendingAuth(env, state);
  if (!codeVerifier) {
    return Response.redirect(`${env.APP_ORIGIN}/#/login-error?error=invalid_state`, 302);
  }

  // Exchange code for tokens
  const tokenRes = await fetch(env.BATTLE_NET_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${url.origin}/auth/callback`,
      client_id: env.BNET_CLIENT_ID,
      client_secret: env.BNET_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return Response.redirect(`${env.APP_ORIGIN}/#/login-error?error=token_exchange_failed`, 302);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Fetch battletag
  let battletag: string | undefined;
  const userRes = await fetch("https://eu.battle.net/oauth/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (userRes.ok) {
    const user = (await userRes.json()) as { battletag?: string };
    battletag = user.battletag;
  }

  const sessionData: SessionData = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    battletag,
  };

  const sessionId = await createSession(env, sessionData);

  return new Response(null, {
    status: 302,
    headers: {
      Location: env.APP_ORIGIN,
      "Set-Cookie": sessionCookie(sessionId, 60 * 60 * 24 * 7),
    },
  });
}

export async function handleMe(req: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(req);
  if (!sessionId) {
    return Response.json({ loggedIn: false });
  }

  const session = await getSession(env, sessionId);
  if (!session) {
    return Response.json({ loggedIn: false });
  }

  return Response.json({ loggedIn: true, battletag: session.battletag || null });
}

export async function handleLogout(req: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(req);
  if (sessionId) {
    await deleteSession(env, sessionId);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie("", 0),
    },
  });
}
