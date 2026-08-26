# Mobile Release Runbook

## Environments

- Development: local API reachable from emulator/device through `EXPO_PUBLIC_API_URL`.
- Preview: internal EAS distribution connected to a staging API over HTTPS.
- Production: App Store/Play Store build connected only to the production HTTPS API.

Never embed database credentials, JWT secrets, OpenAI keys, FCM service accounts or APNs keys in `EXPO_PUBLIC_*` variables.

## Required external setup

1. Create an Expo/EAS project and set `EXPO_PUBLIC_EAS_PROJECT_ID`.
2. Configure Apple bundle ID and Android package ownership.
3. Configure APNs/FCM credentials in EAS.
4. Host `apple-app-site-association` and `.well-known/assetlinks.json` on `app.moneymate.vn`.
5. Publish the privacy policy and support/account-deletion URLs.
6. Provide store descriptions, screenshots, data-safety answers and permission disclosures.

## Build and verification

```bash
npm ci
npm run build
npm exec --workspace=moneymate-mobile -- expo-doctor
npx eas-cli build --profile preview --platform all
```

Before production rollout, verify on physical iOS and Android devices:

- Login, token rotation, logout and remote session revoke.
- Face ID/Touch ID/fingerprint and app-switcher privacy shield.
- Camera permission, receipt upload, OCR review and correction.
- Push permission, foreground/background/killed delivery and deep links.
- Offline read cache, queued transaction, retry, duplicate prevention and conflict response.
- Account deletion and local cache/credential removal.
- Screen reader labels, dynamic text, contrast and keyboard behavior where applicable.

## Rollout and rollback

Use staged rollout. Monitor API 5xx/401/409 rates, push failures, crash-free sessions, OCR latency and outbox failures. Pause rollout when authentication, data duplication or crash metrics regress.

Mobile binaries cannot be rolled back instantly. Disable affected server-side capability where possible, publish a forward fix, and use EAS Update only for changes compatible with the installed runtime version. Database migrations in this release are forward-fixed; restoring the old auth application after token hashing signs users out.
