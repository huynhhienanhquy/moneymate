import '../helpers/prisma-mock';
import { GoalTransactionType, WalletType } from '@prisma/client';
import { SavingGoalRepository } from '../../repositories/saving-goal.repository';
import { WalletRepository } from '../../repositories/wallet.repository';
import { NotificationService } from '../../services/notification.service';
import { SavingGoalService } from '../../services/saving-goal.service';

jest.mock('../../repositories/saving-goal.repository');
jest.mock('../../repositories/wallet.repository');
jest.mock('../../services/notification.service');

const MockSavingGoalRepository = SavingGoalRepository as jest.MockedClass<typeof SavingGoalRepository>;
const MockWalletRepository = WalletRepository as jest.MockedClass<typeof WalletRepository>;
const MockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;

const goal = (currentAmount: number) => ({
  id: 'goal-1',
  userId: 'user-1',
  title: 'Emergency fund',
  targetAmount: '1000' as any,
  currentAmount: String(currentAmount) as any,
  targetDate: new Date('2030-01-01T00:00:00.000Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
  goalTransactions: [],
});

const wallet = {
  id: 'wallet-1',
  userId: 'user-1',
  name: 'Main wallet',
  type: WalletType.BANK,
  currency: 'VND',
  initialBalance: '1000' as any,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SavingGoalService financial integrity', () => {
  let service: SavingGoalService;
  let savingGoalRepository: jest.Mocked<SavingGoalRepository>;
  let walletRepository: jest.Mocked<WalletRepository>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    MockSavingGoalRepository.mockClear();
    MockWalletRepository.mockClear();
    MockNotificationService.mockClear();
    service = new SavingGoalService();
    savingGoalRepository = MockSavingGoalRepository.mock.instances[0] as jest.Mocked<SavingGoalRepository>;
    walletRepository = MockWalletRepository.mock.instances[0] as jest.Mocked<WalletRepository>;
    notificationService = MockNotificationService.mock.instances[0] as jest.Mocked<NotificationService>;
  });

  afterEach(() => jest.restoreAllMocks());

  it('refuses to delete a goal while it still contains funds', async () => {
    savingGoalRepository.findById.mockResolvedValue(goal(500));

    await expect(service.deleteGoal('user-1', 'goal-1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'SAVING_GOAL_NOT_EMPTY',
    });
    expect(savingGoalRepository.deleteIfUnused).not.toHaveBeenCalled();
  });

  it('retains a zero-balance goal that has funding history', async () => {
    savingGoalRepository.findById.mockResolvedValue({
      ...goal(0),
      goalTransactions: [{ id: 'goal-transaction-1' }],
    } as any);

    await expect(service.deleteGoal('user-1', 'goal-1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'SAVING_GOAL_NOT_EMPTY',
    });
    expect(savingGoalRepository.deleteIfUnused).not.toHaveBeenCalled();
  });

  it('fails closed when the goal is funded concurrently with deletion', async () => {
    savingGoalRepository.findById.mockResolvedValue(goal(0));
    savingGoalRepository.deleteIfUnused.mockResolvedValue(false);

    await expect(service.deleteGoal('user-1', 'goal-1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'SAVING_GOAL_NOT_EMPTY',
    });
  });

  it('deletes a never-funded zero-balance goal', async () => {
    savingGoalRepository.findById.mockResolvedValue(goal(0));
    savingGoalRepository.deleteIfUnused.mockResolvedValue(true);

    await expect(service.deleteGoal('user-1', 'goal-1')).resolves.toBe(true);
  });

  it('returns a committed deposit when completion notification delivery fails', async () => {
    savingGoalRepository.findById
      .mockResolvedValueOnce(goal(900))
      .mockResolvedValueOnce(goal(1000));
    savingGoalRepository.addGoalTransaction.mockResolvedValue({
      id: 'goal-transaction-1',
      savingGoalId: 'goal-1',
      walletId: 'wallet-1',
      amount: '100' as any,
      type: GoalTransactionType.DEPOSIT,
      createdAt: new Date(),
    });
    walletRepository.findById.mockResolvedValue(wallet);
    notificationService.create.mockRejectedValue(new Error('notification database unavailable'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(service.deposit('user-1', 'goal-1', {
      walletId: 'wallet-1',
      amount: 100,
    })).resolves.toMatchObject({ currentAmount: 1000, status: 'COMPLETED' });
    expect(errorSpy).toHaveBeenCalledWith(
      'Saving goal completion notification failed after deposit commit',
      expect.objectContaining({ userId: 'user-1', goalId: 'goal-1' }),
    );
    errorSpy.mockRestore();
  });
});
