# Blizzard API Guide

EU-only project. All endpoints use EU region.

## Base URLs

- OAuth: `https://oauth.battle.net` (EU)
- Game Data API: `https://eu.api.blizzard.com`
- Profile API: `https://eu.api.blizzard.com`

## Namespaces

- `static-eu` — Game data (achievements, categories)
- `profile-eu` — Character profiles
- `dynamic-eu` — Realms, connected realms

## Authentication

### Client Credentials (server-to-server)
```
POST https://oauth.battle.net/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={id}&client_secret={secret}
```
Use for: Game Data API calls (public data)

### User OAuth (Authorization Code + PKCE)
```
GET https://oauth.battle.net/authorize?
  client_id={id}&
  redirect_uri={uri}&
  response_type=code&
  scope=wow.profile&
  state={state}&
  code_challenge={challenge}&
  code_challenge_method=S256
```
Use for: Profile API calls (user's characters)

## Rate Limits

- 36,000 requests/hour per client
- 100 requests/second burst
- Returns 429 when exceeded

## Common Endpoints

### Achievement Categories
```
GET /data/wow/achievement-category/index
?namespace=static-eu&locale=en_US
```

### Achievement Details
```
GET /data/wow/achievement/{id}
?namespace=static-eu&locale=en_US
```

### Character Achievements
```
GET /profile/wow/character/{realm}/{name}/achievements
?namespace=profile-eu&locale=en_US
```

### User's Characters
```
GET /profile/user/wow
?namespace=profile-eu&locale=en_US
```
Requires user OAuth token.

### Realm Index
```
GET /data/wow/realm/index
?namespace=dynamic-eu&locale=en_US
```

## Common Errors

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Token expired/invalid | Refresh token |
| 403 | Character not public | Return NOT_PUBLIC |
| 404 | Character/realm not found | Return NOT_FOUND |
| 429 | Rate limited | Back off, retry |
| 503 | Blizzard maintenance | Return UPSTREAM_ERROR |

## Realm Normalization

Realm slugs are lowercase, hyphenated:
- "Argent Dawn" → "argent-dawn"
- "Twisting Nether" → "twisting-nether"

Use `encodeURIComponent()` for special characters.
