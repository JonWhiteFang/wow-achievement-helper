export type Env = {
  SESSIONS: KVNamespace;
  APP_ORIGIN: string;
  BATTLE_NET_REGION: "eu";
  BATTLE_NET_OAUTH_AUTHORIZE: string;
  BATTLE_NET_OAUTH_TOKEN: string;
  BLIZZARD_API_HOST: string;
  PROFILE_API_HOST: string;
  BNET_CLIENT_ID: string;
  BNET_CLIENT_SECRET: string;
  SESSION_SIGNING_KEY: string;
  SENTRY_DSN?: string;
};
