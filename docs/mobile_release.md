# Mobile Release Runbook

> Operational checklist for the Expo SDK 57 application. Verify values against the target environment before every release.

## Environments

- Local development uses `apps/mobile/.env` and a developer-reachable API.
- Android emulators can reach a host API through `http://10.0.2.2:5000/api`.
- Physical devices on the same network may derive the Metro host when `EXPO_PUBLIC_API_URL` is empty.
- Tunnel mode requires an API URL reachable independently from the phone.
- Preview and production must use an HTTPS API URL.

Never put JWT secrets, database credentials, OpenAI keys, S3 secrets, or push-service private credentials in `EXPO_PUBLIC_*` variables.

## Required external setup

- Apple Developer, Google Play, and Expo/EAS accounts.
- Bundle/application identifiers and signing credentials.
- APNs/FCM credentials connected to Expo push notifications.
- A production HTTPS API and exact CORS origin configuration.
- Universal Link/App Link domain files and deep-link verification.
- Durable S3-compatible attachment storage.
- Published privacy policy, support contact, store metadata, screenshots, and data-safety declarations.

## Preflight checks

From the repository root:

```bash
npm ci
npm run build:packages
npm run typecheck --workspace=moneymate-mobile
npm run lint --workspace=moneymate-mobile
```

Then run the Expo-specific checks from the mobile workspace:

```bash
cd apps/mobile
npx expo-doctor
npx expo export --platform android --output-dir dist
npx expo export --platform ios --output-dir dist-ios
```

Also run backend unit/integration tests and web tests because mobile shares the API and packages.

## Database and backend readiness

1. Back up production data and prove that the backup can be restored.
2. Review pending migrations with `prisma migrate status` against a staging database.
3. Apply migrations using the backend release process; never use `migrate reset` in production.
4. Verify authentication rotation, transaction idempotency, sync tombstones, recurring processing, report snapshots, attachment storage, and push registration.
5. Confirm the API health endpoint and Swagger contract match the mobile build.

## Device verification

Use a development or release build on at least one physical iOS and Android device. Verify:

- registration, login, refresh after restart, logout, and session revocation;
- dashboard, wallets, categories, transactions, transfers, budgets, savings goals, recurring items, reports, and monthly balance;
- create/update/delete conflicts and offline outbox replay without duplicate writes;
- cursor sync after edits and deletes made on another client;
- camera permission, image selection, receipt OCR, and attachment access;
- biometric lock and screenshot/privacy protection;
- push registration, receipt, tap routing, and token refresh;
- deep links from cold, background, and foreground states;
- light/dark themes, accessibility text sizes, reduced motion, VoiceOver/TalkBack, and Android Back behavior;
- poor-network, airplane-mode, expired-session, server-error, and storage-error states.

Expo Go is not sufficient for final validation of all native features.

## Release and rollout

1. Build signed preview binaries and complete internal testing.
2. Freeze the API contract used by the candidate build.
3. Submit staged production builds to TestFlight and Play internal/closed testing.
4. Monitor authentication failures, API error rates, sync conflicts, duplicate idempotency attempts, push delivery, and crash reports.
5. Increase rollout gradually only after stability and data-integrity checks pass.

## Rollback

- Stop or pause the store rollout first.
- Roll back the mobile binary only when the API remains backward compatible.
- Prefer forward-fix database migrations; do not delete an applied migration.
- Disable optional AI/Copilot or push features through server/build configuration when they are the isolated failure source.
- If session compatibility changes, be prepared to revoke sessions and require sign-in again.
- Preserve logs, request IDs, affected app versions, and migration state for incident review.
