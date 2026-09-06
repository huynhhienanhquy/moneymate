import prisma from '../config/db';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  async create(data: { email: string; passwordHash: string; fullName: string }) {
    return prisma.user.create({
      data
    });
  }

  async update(id: string, data: { fullName?: string; avatarUrl?: string | null }) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updatePasswordAndRevokeSessions(id: string, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  async deleteById(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
