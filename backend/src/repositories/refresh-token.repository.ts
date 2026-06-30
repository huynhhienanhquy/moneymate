import prisma from '../config/db';

export class RefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  async findByToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token }
    });
  }

  async deleteByToken(token: string) {
    return prisma.refreshToken.delete({
      where: { token }
    }).catch(() => null); // Ignore error if token not found
  }

  async deleteByUserId(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }
}
