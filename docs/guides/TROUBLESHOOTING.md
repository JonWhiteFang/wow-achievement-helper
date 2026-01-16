# Troubleshooting Guide

Common issues and solutions for the WoW Achievement Helper.

## Frontend Issues

### "Failed to fetch achievements" / Network Error

**Symptoms:** App shows error, achievements don't load

**Causes & Solutions:**

1. **Worker not running locally**
   ```bash
   npm run dev:worker
   ```

2. **Wrong API base URL**
   - Check `apps/web/.env.development` has `VITE_API_BASE=http://localhost:8787`
   - Restart frontend after changing env

3. **Manifest not built**
   - First-time setup requires building the manifest:
   ```bash
   curl -X POST http://localhost:8787/api/admin/build-manifest
   # Repeat until response shows "done": true
   ```

### CORS Errors

**Symptoms:** Console shows "Access-Control-Allow-Origin" errors

**Causes & Solutions:**

1. **Local development**
   - Ensure worker is running on port 8787
   - Frontend must be on port 5173 (or update worker CORS)

2. **Production**
   - Worker only allows `https://jonwhitefang.github.io` origin
   - Check `APP_ORIGIN` in `wrangler.toml`

### Search Not Working

**Symptoms:** Typing in search box does nothing

**Causes & Solutions:**

1. **Manifest not loaded**
   - Wait for achievements to load first
   - Check network tab for `/api/manifest` response

2. **Empty results**
   - Search is fuzzy but requires some match
   - Try simpler search terms

### Character Lookup Fails

**Symptoms:** "Character not found" or "Not public"

**Causes & Solutions:**

1. **NOT_PUBLIC error**
   - Character has achievements hidden in privacy settings
   - User must enable "Display Only Character Achievements to Others" in WoW

2. **NOT_FOUND error**
   - Check realm spelling (use dropdown)
   - Check character name spelling
   - Character may have been transferred/deleted

3. **Realm not in list**
   - Realm list is EU-only
   - US/KR/TW/CN realms not supported

## Worker Issues

### "Manifest is being built" (NOT_READY)

**Symptoms:** 503 error, manifest endpoint returns NOT_READY

**Solutions:**

1. **Trigger manual build:**
   ```bash
   curl -X POST http://localhost:8787/api/admin/build-manifest
   ```
   Repeat until `"done": true`

2. **Reset and rebuild:**
   ```bash
   curl -X POST "http://localhost:8787/api/admin/build-manifest?reset=true"
   ```

### OAuth Login Fails

**Symptoms:** Login redirects but callback fails

**Causes & Solutions:**

1. **Wrong redirect URI**
   - Local: Must be `http://localhost:8787/auth/callback`
   - Production: Must be `https://wow-achievement-helper-api.jono2411.workers.dev/auth/callback`
   - Update in Blizzard Developer Portal

2. **Missing secrets**
   - Local: Create `workers/api/.dev.vars` with credentials
   - Production: Set via `wrangler secret put`

3. **Expired state**
   - OAuth state expires after 10 minutes
   - Try logging in again

### Session Expired

**Symptoms:** "Session expired" banner, logged out unexpectedly

**Causes & Solutions:**

1. **Normal expiry**
   - Sessions expire after 24 hours
   - Click "Sign in" to re-authenticate

2. **Worker redeployed**
   - KV sessions persist across deploys
   - If KV was reset, sessions are lost

### Rate Limited by Blizzard

**Symptoms:** 429 errors, RATE_LIMITED responses

**Solutions:**

1. **Wait and retry**
   - Blizzard allows 36,000 requests/hour
   - Rate limits reset hourly

2. **Reduce merge characters**
   - Merging many characters makes many API calls
   - Select fewer characters

## Build & Deploy Issues

### TypeScript Errors

**Symptoms:** `npm run typecheck` fails

**Solutions:**

1. **Check specific workspace:**
   ```bash
   npm run typecheck:web
   npm run typecheck:worker
   ```

2. **Common fixes:**
   - Missing types: `npm install`
   - Import errors: Check file paths
   - Type mismatches: Check API response shapes

### Wrangler Deploy Fails

**Symptoms:** `wrangler deploy` errors

**Causes & Solutions:**

1. **Not logged in:**
   ```bash
   wrangler login
   ```

2. **Missing KV namespace:**
   - Check `wrangler.toml` has correct KV ID
   - Create namespace: `wrangler kv:namespace create SESSIONS`

3. **Missing secrets:**
   ```bash
   wrangler secret put BNET_CLIENT_ID
   wrangler secret put BNET_CLIENT_SECRET
   ```

### GitHub Pages Deploy Fails

**Symptoms:** Pages workflow fails

**Solutions:**

1. **Check build:**
   ```bash
   npm run build:web
   ```

2. **Check workflow permissions:**
   - Repository Settings → Actions → General
   - Enable "Read and write permissions"

## Debugging Tips

### Check Worker Logs

Local:
```bash
npm run dev:worker
# Logs appear in terminal
```

Production:
```bash
wrangler tail
```

### Check Network Requests

1. Open browser DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Check request/response for API calls

### Test Endpoints Directly

```bash
# Health check
curl http://localhost:8787/healthz

# Realms
curl http://localhost:8787/api/realms

# Character (replace realm/name)
curl http://localhost:8787/api/character/silvermoon/charactername/achievements

# Auth status
curl -b "session_id=xxx" http://localhost:8787/auth/me
```

### Clear Local State

If the app is in a bad state:

1. Open DevTools → Application → Local Storage
2. Clear `wow-achievement-helper` entries
3. Refresh the page

## Getting Help

1. Check existing issues: https://github.com/JonWhiteFang/wow-achievement-helper/issues
2. Review documentation in `/docs`
3. Open a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment details
   - Console errors (if any)
