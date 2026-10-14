import prisma from '../config/db';
import { NotificationType, Prisma } from '@prisma/client';

export class NotificationRepository {
  /**
   * Register device for the notification workflow.
   *
   * Use it from services that need notification persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to register device for the notification workflow.
   * @returns A promise containing the resulting notification value.
   */
  async registerDevice(userId: string, data: {
    deviceId: string;
    token: string;
    platform: string;
    provider: string;
    appVersion?: string;
    locale?: string;
    timezone?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Remove an obsolete token for this logical device, then atomically claim
      // the globally unique physical token for the currently authenticated user.
      await tx.deviceToken.deleteMany({
        where: {
          userId,
          deviceId: data.deviceId,
          provider: data.provider,
          token: { not: data.token },
        },
      });
      return tx.deviceToken.upsert({
        where: { token: data.token },
        update: { userId, ...data, isActive: true, lastSeenAt: new Date() },
        create: { userId, ...data },
      });
    });
  }

  /**
   * Unregister device for notification.
   *
   * Use it from services that need notification persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param deviceId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting notification value.
   */
  async unregisterDevice(userId: string, deviceId: string) {
    return prisma.deviceToken.updateMany({
      where: { userId, deviceId, isActive: true },
      data: { isActive: false }
    });
  }

  /**
   * Find active device tokens in the notification data source.
   *
   * Use it from services that need notification persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting notification value.
   */
  async findActiveDeviceTokens(userId: string) {
    return prisma.deviceToken.findMany({
      where: { userId, isActive: true, provider: 'expo' },
      select: { id: true, token: true }
    });
  }

  /**
   * Deactivate device token for notification.
   *
   * Use it from services that need notification persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting notification value.
   */
  async deactivateDeviceToken(id: string) {
    return prisma.deviceToken.updateMany({ where: { id }, data: { isActive: false } });
  }

  /**
   * Create notification for the notification workflow.
   *
   * Use it from services that need notification persistence.
   * @param data - The input data required to create notification for the notification workflow.
   * @returns A promise containing the resulting notification value.
   */
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    return prisma.notification.create({ data });
  }

  /**
   * Find all by user id in the notification data source.
   *
   * Use it from services that need notification persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param options - Settings that customize how the operation runs.
   * @returns A promise containing the resulting notification value.
   */
  async findAllByUserId(userId: string, options?: { unreadOnly?: boolean; take?: number }) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (options?.unreadOnly) where.isRead = false;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.take,
    });
  }

  /**
   * Count unread for notification.
   *
   * Use it from services that need notification persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting notification value.
   */
  async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  /**
   * Mark as read for notification.
   *
   * Use it from services that need notification persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting notification value.
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all as read for notification.
   *
   * Use it from services that need notification persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting notification value.
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete notification through the notification workflow.
   *
   * Use it from services that need notification persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting notification value.
   */
  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  }
}
