# Authentication Sessions

> Implementation reference, verified against the repository on 2026-09-24.

MoneyMate uses a 15-minute HS256 JWT access token and a seven-day opaque refresh token. Access tokens authorize API calls; refresh records provide revocable, device-aware sessions.

## Client transports

### Web

- Login omits `platform` or sends `platform: "web"`.
- The refresh token is stored only in an HttpOnly cookie with `SameSite=Lax`; `Secure` is enabled in production.
- The access token is returned in the response and kept in application memory.
- Refresh and logout use the cookie automatically.

### iOS and Android

- Login sends `platform` plus optional `deviceId`, `deviceName`, `appVersion`, and `timezone`.
- The refresh token is returned in the response body for SecureStore and is also set as a compatibility cookie.
- A refresh request that uses a body token receives the rotated token in the body.
- Mobile access tokens remain in application memory.

## Storage and rotation

- Refresh tokens are generated from 48 cryptographically secure random bytes.
- Only a SHA-256 token hash is stored in `refresh_tokens`.
- Each login starts a new token family.
- Refresh atomically revokes the one-time token and creates its successor.
- Concurrent reuse or replay revokes the complete token family and returns `REFRESH_TOKEN_REUSED`.
- Logout sets `revokedAt` on the matching record instead of deleting audit history.
- Users can list active sessions, revoke one session, or revoke all sessions.

## Authorization

Access-token claims contain `userId`, `email`, and `role`. Private routes validate the token and resolve the authenticated user before reaching business logic. Administrator routes additionally require `role=ADMIN`.

User-owned resources must be scoped by the authenticated user ID in services and repositories. Resource identifiers supplied by a client are never sufficient proof of ownership.

## Security configuration

- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are always required.
- Production rejects known example secrets and values shorter than 32 characters.
- Login and registration use configurable in-memory rate limits.
- Production cookies require HTTPS.
- Production CORS accepts only exact origins from `FRONTEND_URL`.

## Session lifecycle

```text
login
  -> create token family
  -> return access token
  -> store/return refresh token according to platform

refresh
  -> hash supplied token
  -> reject expired/revoked/replayed token
  -> atomically revoke old record and create child
  -> return new access token and rotated refresh token

logout/revoke
  -> set revokedAt
  -> reject future refresh attempts
```

## Migration and operations

Migration `20260822090000_secure_multi_device_sessions` introduced token hashes, token families, device metadata, revocation timestamps, and indexes.

Before session-schema changes in production:

1. Back up `refresh_tokens` and verify restoration.
2. Deploy schema and backend changes together.
3. Verify web cookie login/refresh/logout.
4. Verify mobile body-token rotation and SecureStore persistence.
5. Verify replay detection and one/all-session revocation.

Rolling an application back behind the hash migration can invalidate existing sessions. Prefer a forward fix; forcing users to sign in again is the safe fallback.
