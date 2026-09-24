import prisma from '../config/db';
import { WalletType } from '@prisma/client';

export class WalletRepository {
  async create(data: { userId: string; name: string; type: WalletType; currency?: string; initialBalance: number }) {
    return prisma.wallet.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        currency: data.currency || 'VND',
        initialBalance: data.initialBalance
      }
    });
  }

  async findById(id: string) {
    return prisma.wallet.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.wallet.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: { name?: string; type?: WalletType; initialBalance?: number }) {
    return prisma.wallet.update({
      where: { id },
      data
    });
  }

  async archive(id: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.wallet.updateMany({
        where: { id, userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (result.count !== 1) return false;
      await tx.recurringTransaction.updateMany({
        where: { walletId: id, userId, isActive: true },
        data: { isActive: false },
      });
      return true;
    });
  }
}
