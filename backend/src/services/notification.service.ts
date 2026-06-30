import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from '@prisma/client';
import { AppError } from '../common/app-error';

export class NotificationService {
  private notificationRepository = new NotificationRepository();

  async create(userId: string, data: { title: string; message: string; type: NotificationType }) {
    return this.notificationRepository.create({ userId, ...data });
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
