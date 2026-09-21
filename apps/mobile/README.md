# MoneyMate Mobile

Expo SDK 57 application for iOS and Android. Use an Expo development build for
native features such as remote push notifications; Expo Go can still be used for
the rest of the local development flow.

## Setup

```bash
copy .env.example .env
npm run start
```
npx expo start --clear
npx expo start --offline --clear

During local Expo development, leave `EXPO_PUBLIC_API_URL` empty so the app can
derive the backend host from Metro. Set it to a device-reachable HTTPS URL for
preview and production builds. Set `EXPO_PUBLIC_EAS_PROJECT_ID` before
registering push notifications.

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Physical devices and a development build are required to fully verify biometrics,
push notifications and camera behavior. Android emulators need Google Play
services for remote push notifications.
