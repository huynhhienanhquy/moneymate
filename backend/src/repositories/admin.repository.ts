import prisma from '../config/db';

export class AdminRepository {
  async findAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
            wallets: true,
          }
        }
      }
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
            wallets: true,
            budgets: true,
            savingGoals: true,
            recurringTransactions: true,
          }
        }
      }
    });
  }

  async updateUser(id: string, data: { fullName?: string; role?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.role !== undefined && { role: data.role as any }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      }
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
