import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { apiRequest, mobilePlatform } from '@/lib/api';
import { sessionStorage } from '@/storage/session';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: true })
});

export async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('money-alerts', {
      name: 'Cảnh báo tài chính',
      importance: Notifications.AndroidImportance.HIGH
    });
  }
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Bạn chưa cấp quyền thông báo');
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Thiếu EXPO_PUBLIC_EAS_PROJECT_ID');
  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const cached = JSON.parse(await sessionStorage.getUser() || '{}');
  if (!cached.deviceId) throw new Error('Không tìm thấy mã thiết bị');
  await apiRequest('/notifications/devices', {
    method: 'POST',
    body: JSON.stringify({
      deviceId: cached.deviceId,
      token: pushToken,
      platform: mobilePlatform,
      provider: 'expo',
      appVersion: '1.0.0',
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  });
  return pushToken;
}
