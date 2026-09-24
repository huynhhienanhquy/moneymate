# Authentication Sessions

MoneyMate supports browser-cookie sessions and mobile token sessions through the same auth endpoints.

## Client contracts

- Web login omits `platform` or sends `platform: "web"`. The refresh token is returned only as an HttpOnly cookie.
- iOS/Android login sends `platform`, plus optional device metadata. The refresh token is returned in the response body for SecureStore and is also set as a cookie for backward compatibility.
- A refresh request using a body token receives the rotated refresh token in the body. A cookie refresh receives it through the rotated cookie only.
- Access tokens should remain in application memory.

## Storage and rotation

Refresh tokens are generated using a cryptographically secure random source. Only their SHA-256 hashes are stored. Refresh consumes a record atomically before creating the next token in the same token family, preventing two concurrent refresh requests from both succeeding.

Logout revokes the matching session instead of deleting its audit record.

## Migration rollout

Migration `20260822090000_secure_multi_device_sessions` adds nullable metadata, hashes existing tokens, fills token families, then applies constraints and indexes.

Deploy the migration together with the matching backend release. Existing raw tokens continue working because the new backend hashes incoming values before lookup. Rolling back only the application after the migration makes the old backend unable to find tokens and forces users to sign in again; forward-fix is the preferred recovery path.

Before production migration:

1. Back up and verify restore for `refresh_tokens`.
2. Record row count and confirm all token values are non-null.
3. Schedule the migration with the matching backend release.
4. Verify login, one successful refresh, replay rejection and logout.
