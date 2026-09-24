import '../helpers/prisma-mock';
import prisma from '../../config/db';
import { WalletRepository } from '../../repositories/wallet.repository';

describe('WalletRepository archive', () => {
  it('hides archived wallets from reads', async () => {
    const repository = new WalletRepository();
    await repository.findById('wallet-1');
    await repository.findAllByUserId('user-1');

    expect(prisma.wallet.findFirst).toHaveBeenCalledWith({ where: { id: 'wallet-1', deletedAt: null } });
    expect(prisma.wallet.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('archives the wallet and pauses its schedules in one transaction', async () => {
    const tx = {
      wallet: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      recurringTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));

    await expect(new WalletRepository().archive('wallet-1', 'user-1')).resolves.toBe(true);
    expect(tx.wallet.updateMany).toHaveBeenCalledWith({
      where: { id: 'wallet-1', userId: 'user-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect(tx.recurringTransaction.updateMany).toHaveBeenCalledWith({
      where: { walletId: 'wallet-1', userId: 'user-1', isActive: true },
      data: { isActive: false },
    });
  });

  it('does not pause schedules when the wallet was already archived', async () => {
    const tx = {
      wallet: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      recurringTransaction: { updateMany: jest.fn() },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));

    await expect(new WalletRepository().archive('wallet-1', 'user-1')).resolves.toBe(false);
    expect(tx.recurringTransaction.updateMany).not.toHaveBeenCalled();
  });
});
