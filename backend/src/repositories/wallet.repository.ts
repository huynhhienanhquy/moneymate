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
    return prisma.wallet.findUnique({
      where: { id }
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: { name?: string; type?: WalletType; initialBalance?: number }) {
    return prisma.wallet.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.wallet.delete({
      where: { id }
    });
  }
}
