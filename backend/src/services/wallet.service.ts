import { WalletRepository } from '../repositories/wallet.repository';
import { AppError } from '../common/app-error';
import { WalletType } from '@prisma/client';

export class WalletService {
  private walletRepository = new WalletRepository();

  /**
   * Create wallet for the wallet workflow.
   *
   * Use it from controllers or jobs that run the wallet business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to create wallet for the wallet workflow.
   * @returns A promise containing the resulting wallet value.
   */
  async createWallet(userId: string, data: { name: string; type: WalletType; currency?: string; initialBalance: number }) {
    return this.walletRepository.create({
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      initialBalance: data.initialBalance
    });
  }

  /**
   * Return wallets required by the wallet workflow.
   *
   * Use it from controllers or jobs that run the wallet business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting wallet value.
   */
  async getWallets(userId: string) {
    return this.walletRepository.findAllByUserId(userId);
  }

  /**
   * Return wallet required by the wallet workflow.
   *
   * Use it from controllers or jobs that run the wallet business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param walletId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting wallet value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async getWallet(userId: string, walletId: string) {
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found', 404);
    }
    return wallet;
  }

  /**
   * Update wallet while preserving the wallet workflow's rules.
   *
   * Use it from controllers or jobs that run the wallet business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param walletId - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update wallet while preserving the wallet workflow's rules.
   * @returns A promise containing the resulting wallet value.
   */
  async updateWallet(userId: string, walletId: string, data: { name?: string; type?: WalletType; initialBalance?: number }) {
    const wallet = await this.getWallet(userId, walletId);
    const update: { name?: string; type?: WalletType; initialBalance?: number } = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.initialBalance !== undefined) update.initialBalance = data.initialBalance;
    return this.walletRepository.update(wallet.id, update);
  }

  /**
   * Delete wallet through the wallet workflow.
   *
   * Use it from controllers or jobs that run the wallet business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param walletId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting wallet value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async deleteWallet(userId: string, walletId: string) {
    const wallet = await this.getWallet(userId, walletId);
    if (!await this.walletRepository.archive(wallet.id, userId)) {
      throw new AppError('Wallet not found', 404);
    }
    return true;
  }
}
