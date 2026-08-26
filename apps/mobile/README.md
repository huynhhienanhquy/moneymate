# MoneyMate Mobile

Expo SDK 54 application for iOS and Android, compatible with the current Expo Go release on physical iPhone devices.

## Setup

```bash
copy .env.example .env
npm run start
```

Set `EXPO_PUBLIC_API_URL` to an API address reachable by the device. Set `EXPO_PUBLIC_EAS_PROJECT_ID` before registering push notifications.

## Checks

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android
```

Physical devices and a development build are required to fully verify biometrics, push notifications and camera behavior.
