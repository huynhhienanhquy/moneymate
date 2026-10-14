import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '@prisma/client';
import { AppError } from '../common/app-error';
import { PushService } from './push.service';

export class NotificationService {
  private notificationRepository = new NotificationRepository();
  private pushService = new PushService();

  /**
   * Create notification for the notification workflow.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to create notification for the notification workflow.
   * @returns A promise containing the resulting notification value.
   */
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

  /**
   * Register device for the notification workflow.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to register device for the notification workflow.
   * @returns The resulting notification value for the caller.
   */
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

  /**
   * Unregister device for notification.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param deviceId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting notification value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async unregisterDevice(userId: string, deviceId: string) {
    const result = await this.notificationRepository.unregisterDevice(userId, deviceId);
    if (result.count === 0) throw new AppError('Device not found', 404);
    return true;
  }

  /**
   * Return notifications required by the notification workflow.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param unreadOnly - The unread only value required by the operation.
   * @returns A promise containing the resulting notification value.
   */
  async getNotifications(userId: string, unreadOnly?: boolean) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findAllByUserId(userId, { unreadOnly, take: 50 }),
      this.notificationRepository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  }

  /**
   * Mark as read for notification.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting notification value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async markAsRead(userId: string, id: string) {
    const result = await this.notificationRepository.markAsRead(id, userId);
    if (result.count === 0) throw new AppError('Notification not found', 404);
    return true;
  }

  /**
   * Mark all as read for notification.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting notification value.
   */
  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    return true;
  }

  /**
   * Delete notification through the notification workflow.
   *
   * Use it from controllers or jobs that run the notification business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting notification value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async deleteNotification(userId: string, id: string) {
    const result = await this.notificationRepository.delete(id, userId);
    if (result.count === 0) throw new AppError('Notification not found', 404);
    return true;
  }
}
