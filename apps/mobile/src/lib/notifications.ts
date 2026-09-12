import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiRequest, mobilePlatform } from '@/lib/api';
import { sessionStorage } from '@/storage/session';

let _Notifications: typeof import('expo-notifications') | null = null;
let _initialized = false;

function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

function getNotifications(): typeof import('expo-notifications') {
  if (_Notifications) return _Notifications;
  if (isExpoGo()) throw new Error('expo-notifications không hỗ trợ trên Expo Go. Hãy dùng development build.');
  _Notifications = require('expo-notifications');
  if (!_initialized) {
    _initialized = true;
    _Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: true })
    });
  }
  return _Notifications;
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') {
    throw new Error('Thông báo đẩy chưa được hỗ trợ trên phiên bản web');
  }
  const Notifications = getNotifications();
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
