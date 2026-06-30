import { SavingGoalRepository } from '../repositories/saving-goal.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationService } from './notification.service';
import { AppError } from '../common/app-error';
import { GoalTransactionType, NotificationType } from '@prisma/client';

export class SavingGoalService {
  private savingGoalRepository = new SavingGoalRepository();
  private walletRepository = new WalletRepository();
  private notificationService = new NotificationService();

  private getStatus(goal: { currentAmount: any; targetAmount: any; targetDate: Date }) {
    const current = Number(goal.currentAmount);
    const target = Number(goal.targetAmount);
    if (current >= target) return 'COMPLETED';
    if (new Date() > new Date(goal.targetDate)) return 'EXPIRED';
    return 'ACTIVE';
  }

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

  async createGoal(userId: string, data: {
    title: string;
    targetAmount: number;
    targetDate: Date;
  }) {
    if (data.targetAmount <= 0) throw new AppError('Target amount must be positive', 400);
    const goal = await this.savingGoalRepository.create({ userId, ...data });
    return this.enrichGoal(goal);
  }

  async getGoals(userId: string) {
    const goals = await this.savingGoalRepository.findAllByUserId(userId);
    return goals.map((g) => this.enrichGoal(g));
  }

  async getGoal(userId: string, id: string) {
    const goal = await this.savingGoalRepository.findById(id);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    return this.enrichGoal(goal);
  }

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

  async deleteGoal(userId: string, id: string) {
    const goal = await this.savingGoalRepository.findById(id);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    await this.savingGoalRepository.delete(id);
    return true;
  }

  async deposit(userId: string, goalId: string, data: { walletId: string; amount: number }) {
    const goal = await this.savingGoalRepository.findById(goalId);
    if (!goal || goal.userId !== userId) throw new AppError('Saving goal not found', 404);
    if (data.amount <= 0) throw new AppError('Amount must be positive', 400);

    const wallet = await this.walletRepository.findById(data.walletId);
    if (!wallet || wallet.userId !== userId) throw new AppError('Wallet not found', 404);
    if (Number(wallet.initialBalance) < data.amount) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    await this.savingGoalRepository.addGoalTransaction({
      savingGoalId: goalId,
      walletId: data.walletId,
      amount: data.amount,
      type: GoalTransactionType.DEPOSIT,
    });

    const updated = await this.savingGoalRepository.findById(goalId);
    const enriched = this.enrichGoal(updated);

    if (enriched.status === 'COMPLETED') {
      await this.notificationService.create(userId, {
        title: 'Chúc mừng! Mục tiêu hoàn thành',
        message: `Bạn đã đạt mục tiêu tiết kiệm "${goal.title}".`,
        type: NotificationType.GOAL_COMPLETED,
      });
    }

    return enriched;
  }

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
      savingGoalId: goalId,
      walletId: data.walletId,
      amount: data.amount,
      type: GoalTransactionType.WITHDRAW,
    });

    const updated = await this.savingGoalRepository.findById(goalId);
    return this.enrichGoal(updated);
  }
}
