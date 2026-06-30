import '../helpers/prisma-mock';
import { WalletService } from '../../services/wallet.service';
import { WalletRepository } from '../../repositories/wallet.repository';
import { AppError } from '../../common/app-error';
import { WalletType } from '@prisma/client';

jest.mock('../../repositories/wallet.repository');

const MockWalletRepository = WalletRepository as jest.MockedClass<typeof WalletRepository>;

const MOCK_WALLET = {
  id: 'wallet-uuid-1',
  userId: 'user-uuid-1',
  name: 'Tiền mặt',
  type: WalletType.CASH,
  currency: 'VND',
  initialBalance: '2000000' as any,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WalletService', () => {
  let walletService: WalletService;
  let mockWalletRepo: jest.Mocked<WalletRepository>;

  beforeEach(() => {
    MockWalletRepository.mockClear();
    walletService = new WalletService();
    mockWalletRepo = MockWalletRepository.mock.instances[0] as jest.Mocked<WalletRepository>;
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────────
  describe('createWallet()', () => {
    it('should create a wallet successfully', async () => {
      mockWalletRepo.create.mockResolvedValue(MOCK_WALLET);

      const result = await walletService.createWallet('user-uuid-1', {
        name: 'Tiền mặt',
        type: WalletType.CASH,
        initialBalance: 2000000,
      });

      expect(mockWalletRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid-1', name: 'Tiền mặt', type: WalletType.CASH })
      );
      expect(result.name).toBe('Tiền mặt');
    });
  });

  // ─── GET ──────────────────────────────────────────────────────────────────────
  describe('getWallet()', () => {
    it('should return wallet if it belongs to the user', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);

      const result = await walletService.getWallet('user-uuid-1', 'wallet-uuid-1');
      expect(result.id).toBe('wallet-uuid-1');
    });

    it('should throw AppError if wallet belongs to a different user', async () => {
      mockWalletRepo.findById.mockResolvedValue({ ...MOCK_WALLET, userId: 'other-user-id' });

      await expect(walletService.getWallet('user-uuid-1', 'wallet-uuid-1'))
        .rejects.toThrow(AppError);
    });

    it('should throw AppError if wallet not found', async () => {
      mockWalletRepo.findById.mockResolvedValue(null);

      await expect(walletService.getWallet('user-uuid-1', 'wallet-uuid-1'))
        .rejects.toThrow('Wallet not found');
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────────
  describe('updateWallet()', () => {
    it('should update wallet name when authorized', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockWalletRepo.update.mockResolvedValue({ ...MOCK_WALLET, name: 'Updated Name' });

      const result = await walletService.updateWallet('user-uuid-1', 'wallet-uuid-1', { name: 'Updated Name' });

      expect(mockWalletRepo.update).toHaveBeenCalledWith('wallet-uuid-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────────
  describe('deleteWallet()', () => {
    it('should delete wallet when authorized', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockWalletRepo.delete.mockResolvedValue(MOCK_WALLET);

      await walletService.deleteWallet('user-uuid-1', 'wallet-uuid-1');
      expect(mockWalletRepo.delete).toHaveBeenCalledWith('wallet-uuid-1');
    });

    it('should throw AppError when trying to delete another user wallet', async () => {
      mockWalletRepo.findById.mockResolvedValue({ ...MOCK_WALLET, userId: 'other-user' });

      await expect(walletService.deleteWallet('user-uuid-1', 'wallet-uuid-1'))
        .rejects.toThrow(AppError);
    });
  });

  // ─── LIST ─────────────────────────────────────────────────────────────────────
  describe('getWallets()', () => {
    it('should return all wallets for a user', async () => {
      mockWalletRepo.findAllByUserId.mockResolvedValue([MOCK_WALLET, { ...MOCK_WALLET, id: 'wallet-uuid-2', name: 'Techcombank' }]);

      const result = await walletService.getWallets('user-uuid-1');
      expect(result).toHaveLength(2);
      expect(mockWalletRepo.findAllByUserId).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
