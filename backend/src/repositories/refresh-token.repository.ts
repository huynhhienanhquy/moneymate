import prisma from '../config/db';

export interface RefreshTokenRecordInput {
  userId: string;
  tokenHash: string;
  tokenFamily: string;
  expiresAt: Date;
  platform: 'web' | 'ios' | 'android';
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  timezone?: string;
}

export class RefreshTokenRepository {
  async create(input: RefreshTokenRecordInput) {
    return prisma.refreshToken.create({ data: input });
  }

  async findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async consume(tokenHash: string, consumedAt: Date) {
    const record = await this.findByHash(tokenHash);
    if (!record || record.revokedAt || record.expiresAt < consumedAt) return null;

    const result = await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: consumedAt } },
      data: { revokedAt: consumedAt, lastSeenAt: consumedAt }
    });

    return result.count === 1 ? record : null;
  }

  async revokeByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async revokeByUserId(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async findActiveByUserId(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        platform: true,
        appVersion: true,
        timezone: true,
        lastSeenAt: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { lastSeenAt: 'desc' }
    });
  }

  async revokeById(userId: string, id: string) {
    return prisma.refreshToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}
