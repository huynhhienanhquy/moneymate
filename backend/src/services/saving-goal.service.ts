import { SavingGoalRepository } from '../repositories/saving-goal.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationService } from './notification.service';
import { AppError } from '../common/app-error';
import { GoalTransactionType, NotificationType } from '@prisma/client';

export class SavingGoalService {
  private savingGoalRepository = new SavingGoalRepository();
  private walletRepository = new WalletRepository();
  private notificationService = new NotificationService();

  /**
   * Return status required by the saving goal workflow.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param goal - The goal value required by the operation.
   * @returns The resulting saving goal value for the caller.
   */
  private getStatus(goal: { currentAmount: any; targetAmount: any; targetDate: Date }) {
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    if (current >= target) return 'COMPLETED';
    if (new Date() > new Date(goal.targetDate)) return 'EXPIRED';
    return 'ACTIVE';
  }

  /**
   * Enrich goal for saving goal.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param goal - The goal value required by the operation.
   * @returns The resulting saving goal value for the caller.
   */
  private enrichGoal(goal: any) {
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    return {
      ...goal,
      currentAmount: current,
      targetAmount: target,
      progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      status: this.getStatus(goal),
    };
  }

  /**
   * Create goal for the saving goal workflow.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to create goal for the saving goal workflow.
   * @returns A promise containing the resulting saving goal value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async createGoal(userId: string, data: {
    title: string;
    targetAmount: number;
    targetDate: Date;
  }) {
    if (data.targetAmount <= 0) throw new AppError('Target amount must be positive', 400);
    const goal = await this.savingGoalRepository.create({ userId, ...data });
    return this.enrichGoal(goal);
  }

  /**
   * Return goals required by the saving goal workflow.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting saving goal value.
   */
  async getGoals(userId: string) {
    const goals = await this.savingGoalRepository.findAllByUserId(userId);
    return goals.map((g) => this.enrichGoal(g));
  }

  /**
   * Return goal required by the saving goal workflow.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting saving goal value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async getGoal(userId: string, id: string) {
    const goal = await this.savingGoalRepository.findById(id);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    return this.enrichGoal(goal);
  }

  /**
   * Update goal while preserving the saving goal workflow's rules.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update goal while preserving the saving goal workflow's rules.
   * @returns A promise containing the resulting saving goal value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async updateGoal(userId: string, id: string, data: {
    title?: string;
    targetAmount?: number;
    targetDate?: Date;
  }) {
    const goal = await this.savingGoalRepository.findById(id);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    const updated = await this.savingGoalRepository.update(id, data);
    return this.enrichGoal(updated);
  }

  /**
   * Delete goal through the saving goal workflow.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting saving goal value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async deleteGoal(userId: string, id: string) {
    const goal = await this.savingGoalRepository.findById(id);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    if (Number(goal.currentAmount) !== 0 || goal.goalTransactions.length > 0) {
      throw new AppError(
        'Withdraw all funds before deleting; goals with funding history must be retained',
        409,
        [],
        'SAVING_GOAL_NOT_EMPTY',
      );
    }
    const deleted = await this.savingGoalRepository.deleteIfUnused(id, userId);
    if (!deleted) {
      throw new AppError(
        'Saving goal changed while it was being deleted',
        409,
        [],
        'SAVING_GOAL_NOT_EMPTY',
      );
    }
    return true;
  }

  /**
   * Deposit for saving goal.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param goalId - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to deposit for saving goal.
   * @returns A promise containing the resulting saving goal value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async deposit(userId: string, goalId: string, data: { walletId: string; amount: number }) {
    const goal = await this.savingGoalRepository.findById(goalId);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    if (data.amount <= 0) throw new AppError('Amount must be positive', 400);

    const wallet = await this.walletRepository.findById(data.walletId);
    if (!wallet || wallet.userId !== userId) throw new AppError('Wallet not found', 404);
    if (Number(wallet.initialBalance) < data.amount) {
      throw new AppError('Số dư không đủ', 400, [], 'INSUFFICIENT_WALLET_BALANCE');
    }

    await this.savingGoalRepository.addGoalTransaction({
      userId,
      savingGoalId: goalId,
      walletId: data.walletId,
      amount: data.amount,
      type: GoalTransactionType.DEPOSIT,
    });

    const updated = await this.savingGoalRepository.findById(goalId);
    const enriched = this.enrichGoal(updated);

    if (enriched.status === 'COMPLETED') {
      try {
        await this.notificationService.create(userId, {
          title: 'Chúc mừng! Mục tiêu hoàn thành',
          message: `Bạn đã đạt mục tiêu tiết kiệm "${goal.title}".`,
          type: NotificationType.GOAL_COMPLETED,
        });
      } catch (error) {
        console.error('Saving goal completion notification failed after deposit commit', {
          userId,
          goalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return enriched;
  }

  /**
   * Withdraw for saving goal.
   *
   * Use it from controllers or jobs that run the saving goal business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param goalId - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to withdraw for saving goal.
   * @returns A promise containing the resulting saving goal value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async withdraw(userId: string, goalId: string, data: { walletId: string; amount: number }) {
    const goal = await this.savingGoalRepository.findById(goalId);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    if (data.amount <= 0) throw new AppError('Amount must be positive', 400);
    if (Number(goal.currentAmount) < data.amount) {
      throw new AppError('Insufficient goal balance', 400);
    }

    const wallet = await this.walletRepository.findById(data.walletId);
    if (!wallet || wallet.userId !== userId) throw new AppError('Wallet not found', 404);

    await this.savingGoalRepository.addGoalTransaction({
      userId,
      savingGoalId: goalId,
      walletId: data.walletId,
      amount: data.amount,
      type: GoalTransactionType.WITHDRAW,
    });

    const updated = await this.savingGoalRepository.findById(goalId);
    return this.enrichGoal(updated);
  }
}
