import prisma from '../config/db';
import { WalletType } from '@prisma/client';

export class WalletRepository {
  /**
   * Create wallet for the wallet workflow.
   *
   * Use it from services that need wallet persistence.
   * @param data - The input data required to create wallet for the wallet workflow.
   * @returns A promise containing the resulting wallet value.
   */
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

  /**
   * Find by id in the wallet data source.
   *
   * Use it from services that need wallet persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting wallet value.
   */
  async findById(id: string) {
    return prisma.wallet.findFirst({
      where: { id, deletedAt: null }
    });
  }

  /**
   * Find all by user id in the wallet data source.
   *
   * Use it from services that need wallet persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting wallet value.
   */
  async findAllByUserId(userId: string) {
    return prisma.wallet.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update wallet while preserving the wallet workflow's rules.
   *
   * Use it from services that need wallet persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update wallet while preserving the wallet workflow's rules.
   * @returns A promise containing the resulting wallet value.
   */
  async update(id: string, data: { name?: string; type?: WalletType; initialBalance?: number }) {
    return prisma.wallet.update({
      where: { id },
      data
    });
  }

  /**
   * Archive for wallet.
   *
   * Use it from services that need wallet persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting wallet value.
   */
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
