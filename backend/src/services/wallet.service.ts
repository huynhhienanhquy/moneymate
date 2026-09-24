import { WalletRepository } from '../repositories/wallet.repository';
import { AppError } from '../common/app-error';
import { WalletType } from '@prisma/client';

export class WalletService {
  private walletRepository = new WalletRepository();

  async createWallet(userId: string, data: { name: string; type: WalletType; currency?: string; initialBalance: number }) {
    return this.walletRepository.create({
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      initialBalance: data.initialBalance
    });
  }

  async getWallets(userId: string) {
    return this.walletRepository.findAllByUserId(userId);
  }

  async getWallet(userId: string, walletId: string) {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found', 404);
    }
    return wallet;
  }

  async updateWallet(userId: string, walletId: string, data: { name?: string; type?: WalletType; initialBalance?: number }) {
    const wallet = await this.getWallet(userId, walletId);
    const update: { name?: string; type?: WalletType; initialBalance?: number } = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.initialBalance !== undefined) update.initialBalance = data.initialBalance;
    return this.walletRepository.update(wallet.id, update);
  }

  async deleteWallet(userId: string, walletId: string) {
    const wallet = await this.getWallet(userId, walletId);
    if (!await this.walletRepository.archive(wallet.id, userId)) {
      throw new AppError('Wallet not found', 404);
    }
    return true;
  }
}
