# Security Checklist

Use this checklist for PR reviews and before deploying changes.

## OAuth & Tokens

- [ ] OAuth tokens NEVER sent to frontend
- [ ] Tokens stored in KV only (keyed by session ID)
- [ ] Tokens NEVER logged (even in errors)
- [ ] Token refresh happens server-side only

## Sessions

- [ ] Session cookie is HTTPOnly
- [ ] Session cookie is Secure
- [ ] Session cookie has SameSite=Lax
- [ ] Session ID is cryptographically random

## CORS

- [ ] CORS allows only GitHub Pages origin
- [ ] No wildcard (*) in CORS headers
- [ ] Credentials allowed only for exact origin match

## Frontend

- [ ] No client secrets in frontend code
- [ ] No client secrets in VITE_ env vars
- [ ] `credentials: "include"` only on auth endpoints
- [ ] No tokens in localStorage/sessionStorage

## Content Sanitization

- [ ] Provider HTML content sanitized before display
- [ ] Prefer plain text over HTML from providers
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] User input escaped in displays

## API Security

- [ ] Auth endpoints validate session before action
- [ ] Rate limiting on merge endpoint (batch fetches)
- [ ] Error messages don't leak internal details
- [ ] 401 returned for missing/invalid session

## Secrets Management

- [ ] Blizzard client ID/secret in Worker secrets only
- [ ] Secrets accessed via `env` parameter, not globals
- [ ] No secrets committed to git
