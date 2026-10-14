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
  /**
   * Create refresh token for the refresh token workflow.
   *
   * Use it from services that need refresh token persistence.
   * @param input - The input data required to create refresh token for the refresh token workflow.
   * @returns A promise containing the resulting refresh token value.
   */
  async create(input: RefreshTokenRecordInput) {
    return prisma.refreshToken.create({ data: input });
  }

  /**
   * Find by hash in the refresh token data source.
   *
   * Use it from services that need refresh token persistence.
   * @param tokenHash - The token hash value required by the operation.
   * @returns A promise containing the resulting refresh token value.
   */
  async findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  /**
   * Atomically consume a refresh token so it cannot be reused.
   *
   * Use it from services that need refresh token persistence.
   * @param tokenHash - The token hash value required by the operation.
   * @param consumedAt - The consumed at value required by the operation.
   * @returns A promise containing the resulting refresh token value.
   */
  async consume(tokenHash: string, consumedAt: Date) {
    const record = await this.findByHash(tokenHash);
    if (!record || record.revokedAt || record.expiresAt < consumedAt) return null;

    const result = await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: consumedAt } },
      data: { revokedAt: consumedAt, lastSeenAt: consumedAt }
    });

    return result.count === 1 ? record : null;
  }

  /**
   * Rotate for refresh token.
   *
   * Use it from services that need refresh token persistence.
   * @param tokenHash - The token hash value required by the operation.
   * @param consumedAt - The consumed at value required by the operation.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise containing the resulting refresh token value.
   */
  async rotate(tokenHash: string, consumedAt: Date, next: RefreshTokenRecordInput) {
    return prisma.$transaction(async (tx) => {
      const consumed = await tx.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: consumedAt } },
        data: { revokedAt: consumedAt, lastSeenAt: consumedAt },
      });
      if (consumed.count !== 1) return false;
      await tx.refreshToken.create({ data: next });
      return true;
    });
  }

  /**
   * Revoke by hash for refresh token.
   *
   * Use it from services that need refresh token persistence.
   * @param tokenHash - The token hash value required by the operation.
   * @returns A promise containing the resulting refresh token value.
   */
  async revokeByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  /**
   * Revoke by user id for refresh token.
   *
   * Use it from services that need refresh token persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting refresh token value.
   */
  async revokeByUserId(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  /**
   * Revoke family for refresh token.
   *
   * Use it from services that need refresh token persistence.
   * @param tokenFamily - The token family value required by the operation.
   * @returns A promise containing the resulting refresh token value.
   */
  async revokeFamily(tokenFamily: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenFamily, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  /**
   * Find active by user id in the refresh token data source.
   *
   * Use it from services that need refresh token persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting refresh token value.
   */
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

  /**
   * Revoke by id for refresh token.
   *
   * Use it from services that need refresh token persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting refresh token value.
   */
  async revokeById(userId: string, id: string) {
    return prisma.refreshToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}
