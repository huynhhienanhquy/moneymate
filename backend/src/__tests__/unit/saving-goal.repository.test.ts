import '../helpers/prisma-mock';
import { GoalTransactionType } from '@prisma/client';
import prisma from '../../config/db';
import { SavingGoalRepository } from '../../repositories/saving-goal.repository';

describe('SavingGoalRepository atomic balance guards', () => {
  const baseTransaction = () => ({
    wallet: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    savingGoal: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    goalTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'goal-transaction-1' }),
    },
  });

  it('does not debit a wallet after a concurrent request consumed its balance', async () => {
    const tx = baseTransaction();
    tx.wallet.updateMany.mockResolvedValueOnce({ count: 0 });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
    const repository = new SavingGoalRepository();

    await expect(repository.addGoalTransaction({
      userId: 'user-1',
      savingGoalId: 'goal-1',
      walletId: 'wallet-1',
      amount: 80,
      type: GoalTransactionType.DEPOSIT,
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(tx.goalTransaction.create).not.toHaveBeenCalled();
    expect(tx.savingGoal.updateMany).not.toHaveBeenCalled();
  });

  it('does not withdraw after a concurrent request consumed the goal balance', async () => {
    const tx = baseTransaction();
    tx.savingGoal.updateMany.mockResolvedValueOnce({ count: 0 });
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
    const repository = new SavingGoalRepository();

    await expect(repository.addGoalTransaction({
      userId: 'user-1',
      savingGoalId: 'goal-1',
      walletId: 'wallet-1',
      amount: 80,
      type: GoalTransactionType.WITHDRAW,
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(tx.goalTransaction.create).not.toHaveBeenCalled();
    expect(tx.wallet.updateMany).not.toHaveBeenCalled();
  });

  it('records a deposit after both guarded balance updates succeed', async () => {
    const tx = baseTransaction();
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
    const repository = new SavingGoalRepository();

    await expect(repository.addGoalTransaction({
      userId: 'user-1',
      savingGoalId: 'goal-1',
      walletId: 'wallet-1',
      amount: 80,
      type: GoalTransactionType.DEPOSIT,
    })).resolves.toEqual({ id: 'goal-transaction-1' });
    expect(tx.wallet.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'wallet-1', userId: 'user-1' }),
    }));
    expect(tx.savingGoal.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'goal-1', userId: 'user-1' },
    }));
    expect(tx.goalTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('records a withdrawal after both guarded balance updates succeed', async () => {
    const tx = baseTransaction();
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
    const repository = new SavingGoalRepository();

    await expect(repository.addGoalTransaction({
      userId: 'user-1',
      savingGoalId: 'goal-1',
      walletId: 'wallet-1',
      amount: 80,
      type: GoalTransactionType.WITHDRAW,
    })).resolves.toEqual({ id: 'goal-transaction-1' });
    expect(tx.savingGoal.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'goal-1', userId: 'user-1' }),
    }));
    expect(tx.wallet.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'wallet-1', userId: 'user-1', deletedAt: null },
    }));
    expect(tx.goalTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('deletes only a zero-balance goal without ledger history', async () => {
    const mockPrisma = prisma as any;
    mockPrisma.savingGoal.deleteMany.mockResolvedValue({ count: 0 });
    const repository = new SavingGoalRepository();

    await expect(repository.deleteIfUnused('goal-1', 'user-1')).resolves.toBe(false);
    expect(mockPrisma.savingGoal.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'goal-1',
        userId: 'user-1',
        currentAmount: { equals: expect.anything() },
        goalTransactions: { none: {} },
      },
    });
  });
});
