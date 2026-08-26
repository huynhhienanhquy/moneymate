import { NotificationType } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const paths: Partial<Record<NotificationType, string>> = {
  BUDGET_ALERT: '/(tabs)/budgets',
  BILL_REMINDER: '/(tabs)/transactions',
  RECURRING_TRANSACTION: '/(tabs)/transactions',
  GOAL_COMPLETED: '/(tabs)'
};

export class PushService {
  private repository = new NotificationRepository();

  async sendToUser(userId: string, notification: { title: string; message: string; type: NotificationType }) {
    const devices = await this.repository.findActiveDeviceTokens(userId);
    if (!devices.length) return { sent: 0 };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(devices.map((device) => ({
        to: device.token,
        title: notification.title,
        body: notification.message,
        sound: 'default',
        channelId: 'money-alerts',
        data: { type: notification.type, path: paths[notification.type] || '/(tabs)' }
      }))),
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error(`Expo push request failed with status ${response.status}`);
    const result = await response.json() as { data?: Array<{ status: string; details?: { error?: string } }> };
    await Promise.all((result.data || []).map((ticket, index) => {
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        return this.repository.deactivateDeviceToken(devices[index].id);
      }
      return Promise.resolve();
    }));
    return { sent: devices.length };
  }
}
