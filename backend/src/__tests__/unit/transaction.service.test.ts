import '../helpers/prisma-mock';
import { TransactionService } from '../../services/transaction.service';
import { WalletRepository } from '../../repositories/wallet.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { AppError } from '../../common/app-error';
import { TransactionType, CategoryType, WalletType } from '@prisma/client';
import prisma from '../../config/db';

jest.mock('../../repositories/wallet.repository');
jest.mock('../../repositories/category.repository');
jest.mock('../../repositories/transaction.repository');

const MockWalletRepo = WalletRepository as jest.MockedClass<typeof WalletRepository>;
const MockCategoryRepo = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;
const MockTransactionRepo = TransactionRepository as jest.MockedClass<typeof TransactionRepository>;

const MOCK_WALLET = {
  id: 'wallet-1',
  userId: 'user-1',
  name: 'Tiền mặt',
  type: WalletType.CASH,
  currency: 'VND',
  initialBalance: '5000000' as any,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_EXPENSE_CATEGORY = {
  id: 'cat-expense-1',
  userId: null,
  name: 'Ăn uống',
  type: CategoryType.EXPENSE,
  color: '#FF5722',
  icon: 'utensils',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_INCOME_CATEGORY = {
  id: 'cat-income-1',
  userId: null,
  name: 'Lương',
  type: CategoryType.INCOME,
  color: '#4CAF50',
  icon: 'briefcase',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TransactionService', () => {
  let txService: TransactionService;
  let mockWalletRepo: jest.Mocked<WalletRepository>;
  let mockCategoryRepo: jest.Mocked<CategoryRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    MockWalletRepo.mockClear();
    MockCategoryRepo.mockClear();
    MockTransactionRepo.mockClear();
    txService = new TransactionService();
    mockWalletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    mockCategoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
    mockPrisma = prisma as any;
  });

  // ─── CREATE TRANSACTION ───────────────────────────────────────────────────────
  describe('createTransaction()', () => {
    it('should throw AppError if wallet not found', async () => {
      mockWalletRepo.findById.mockResolvedValue(null);

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).rejects.toThrow('Wallet not found or unauthorized');
    });

    it('should throw AppError if wallet belongs to another user', async () => {
      mockWalletRepo.findById.mockResolvedValue({ ...MOCK_WALLET, userId: 'other-user' });

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).rejects.toThrow('Wallet not found or unauthorized');
    });

    it('should throw AppError if category type mismatches transaction type', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      // Income category used for EXPENSE transaction → must fail
      mockCategoryRepo.findById.mockResolvedValue(MOCK_INCOME_CATEGORY);

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-income-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).rejects.toThrow('Transaction type must match category type');
    });

    it('should create transaction using database atomic transaction', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_EXPENSE_CATEGORY);

      const mockCreatedTx = {
        id: 'tx-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: '100000' as any,
        type: TransactionType.EXPENSE,
        note: 'Ăn phở',
        transactionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        wallet: { name: 'Tiền mặt' },
        category: { name: 'Ăn uống', color: '#FF5722' },
      };

      // Mock the prisma.$transaction to call the callback and return the result
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const txClient = {
          transaction: { create: jest.fn().mockResolvedValue(mockCreatedTx) },
          wallet: { update: jest.fn().mockResolvedValue(MOCK_WALLET) },
        };
        return cb(txClient);
      });

      const result = await txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        note: 'Ăn phở',
        transactionDate: new Date(),
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('tx-1');
    });
  });

  // ─── DELETE TRANSACTION ───────────────────────────────────────────────────────
  describe('deleteTransaction()', () => {
    it('should throw AppError when trying to delete another user transaction', async () => {
      const mockTxRepo = MockTransactionRepo.mock.instances[0] as jest.Mocked<TransactionRepository>;
      mockTxRepo.findById.mockResolvedValue({
        id: 'tx-1',
        userId: 'other-user',  // different user!
        walletId: 'wallet-1',
        categoryId: 'cat-1',
        amount: '100000' as any,
        type: TransactionType.EXPENSE,
        note: null,
        transactionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(txService.deleteTransaction('user-1', 'tx-1'))
        .rejects.toThrow('Transaction not found');
    });
  });

  // ─── TRANSFER VALIDATION ──────────────────────────────────────────────────────
  describe('transferBetweenWallets()', () => {
    it('should throw AppError if source and destination are the same', async () => {
      await expect(txService.transferBetweenWallets('user-1', {
        sourceWalletId: 'wallet-1',
        destinationWalletId: 'wallet-1',
        amount: 50000,
        transferDate: new Date(),
      })).rejects.toThrow('Source and destination wallets must be different');
    });

    it('should throw AppError if amount is zero or negative', async () => {
      await expect(txService.transferBetweenWallets('user-1', {
        sourceWalletId: 'wallet-1',
        destinationWalletId: 'wallet-2',
        amount: 0,
        transferDate: new Date(),
      })).rejects.toThrow('Amount must be positive and non-zero');
    });
  });
});
