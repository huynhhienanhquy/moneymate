import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '@prisma/client';
import { AppError } from '../common/app-error';
import { PushService } from './push.service';

export class NotificationService {
  private notificationRepository = new NotificationRepository();
  private pushService = new PushService();

  async create(userId: string, data: { title: string; message: string; type: NotificationType }) {
    const notification = await this.notificationRepository.create({ userId, ...data });
    try {
      await this.pushService.sendToUser(userId, data);
    } catch (error) {
      console.error('Push notification delivery failed', {
        userId,
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return notification;
  }

  registerDevice(userId: string, data: {
    deviceId: string;
    token: string;
    platform: string;
    provider: string;
    appVersion?: string;
    locale?: string;
    timezone?: string;
  }) {
    return this.notificationRepository.registerDevice(userId, data);
  }

  async unregisterDevice(userId: string, deviceId: string) {
    const result = await this.notificationRepository.unregisterDevice(userId, deviceId);
    if (result.count === 0) throw new AppError('Device not found', 404);
    return true;
  }

  async getNotifications(userId: string, unreadOnly?: boolean) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findAllByUserId(userId, { unreadOnly, take: 50 }),
      this.notificationRepository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  }

  async markAsRead(userId: string, id: string) {
    const result = await this.notificationRepository.markAsRead(id, userId);
    if (result.count === 0) throw new AppError('Notification not found', 404);
    return true;
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    return true;
  }

  async deleteNotification(userId: string, id: string) {
    const result = await this.notificationRepository.delete(id, userId);
    if (result.count === 0) throw new AppError('Notification not found', 404);
    return true;
  }
}
