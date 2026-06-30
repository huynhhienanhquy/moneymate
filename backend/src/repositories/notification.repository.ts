import prisma from '../config/db';
import { NotificationType, Prisma } from '@prisma/client';

export class NotificationRepository {
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    return prisma.notification.create({ data });
  }

  async findAllByUserId(userId: string, options?: { unreadOnly?: boolean; take?: number }) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (options?.unreadOnly) where.isRead = false;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.take,
    });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  }
}
