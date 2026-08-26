import prisma from '../config/db';
import { NotificationType, Prisma } from '@prisma/client';

export class NotificationRepository {
  async registerDevice(userId: string, data: {
    deviceId: string;
    token: string;
    platform: string;
    provider: string;
    appVersion?: string;
    locale?: string;
    timezone?: string;
  }) {
    return prisma.deviceToken.upsert({
      where: { userId_deviceId_provider: { userId, deviceId: data.deviceId, provider: data.provider } },
      update: { ...data, isActive: true, lastSeenAt: new Date() },
      create: { userId, ...data }
    });
  }

  async unregisterDevice(userId: string, deviceId: string) {
    return prisma.deviceToken.updateMany({
      where: { userId, deviceId, isActive: true },
      data: { isActive: false }
    });
  }

  async findActiveDeviceTokens(userId: string) {
    return prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { id: true, token: true }
    });
  }

  async deactivateDeviceToken(id: string) {
    return prisma.deviceToken.updateMany({ where: { id }, data: { isActive: false } });
  }

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
