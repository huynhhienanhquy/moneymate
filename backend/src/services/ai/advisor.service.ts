import { ContextBuilderService } from './context-builder.service';
import { LlmProvider } from './llm.provider';
import { formatVND } from '../../config/ai';

export interface AdvisorRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  potentialSaving?: number;
}

export class AdvisorService {
  private contextBuilder = new ContextBuilderService();
  private llm = new LlmProvider();

  async getRecommendations(userId: string) {
    const ctx = await this.contextBuilder.build(userId);
    const recommendations = this.generateRecommendations(ctx);

    let aiAdvice = '';
    if (this.llm.isAvailable()) {
      aiAdvice = await this.llm.chat(
        [{ role: 'user', content: 'Đưa ra 3 lời khuyên tài chính cụ thể, ngắn gọn bằng tiếng Việt.' }],
        `Bạn là cố vấn tài chính cá nhân tại Việt Nam. Dữ liệu người dùng:\n${this.contextBuilder.toPromptText(ctx)}`
      );
    }

    return {
      healthScore: this.calculateHealthScore(ctx),
      recommendations,
      aiAdvice: aiAdvice || recommendations.slice(0, 3).map(r => r.description).join(' '),
      context: {
        savingsRate: ctx.summary.savingsRate,
        netWorth: ctx.summary.netWorth,
        activeGoals: ctx.savingGoals.filter(g => g.status === 'ACTIVE').length,
        budgetsAtRisk: ctx.budgets.filter(b => b.status !== 'OK').length,
      },
      poweredBy: this.llm.isAvailable() ? 'openai' : 'rules',
    };
  }

  private calculateHealthScore(ctx: Awaited<ReturnType<ContextBuilderService['build']>>): number {
    let score = 50;
    if (ctx.summary.savingsRate >= 20) score += 20;
    else if (ctx.summary.savingsRate >= 10) score += 10;
    else score -= 10;

    if (ctx.expenseChangePercent < 0) score += 10;
    else if (ctx.expenseChangePercent > 15) score -= 15;

    const exceededBudgets = ctx.budgets.filter(b => b.status === 'EXCEEDED').length;
    score -= exceededBudgets * 10;

    const completedGoals = ctx.savingGoals.filter(g => g.status === 'COMPLETED').length;
    score += completedGoals * 5;

    if (ctx.summary.netWorth > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(ctx: Awaited<ReturnType<ContextBuilderService['build']>>): AdvisorRecommendation[] {
    const recs: AdvisorRecommendation[] = [];

    if (ctx.summary.savingsRate < 20 && ctx.summary.monthlyIncome > 0) {
      const target = Math.round(ctx.summary.monthlyIncome * 0.2 - ctx.summary.monthlySavings);
      recs.push({
        priority: 'high',
        title: 'Tăng tỷ lệ tiết kiệm',
        description: `Tỷ lệ tiết kiệm hiện tại ${ctx.summary.savingsRate}%. Mục tiêu nên đạt 20% thu nhập.`,
        action: 'Giảm chi tiêu không cần thiết hoặc tăng thu nhập phụ.',
        potentialSaving: Math.max(0, target),
      });
    }

    ctx.budgets.filter(b => b.status === 'EXCEEDED' || b.status === 'WARNING').forEach(b => {
      const reduce = Math.round(b.spent * 0.15);
      recs.push({
        priority: b.status === 'EXCEEDED' ? 'high' : 'medium',
        title: `Kiểm soát "${b.categoryName}"`,
        description: b.status === 'EXCEEDED'
          ? `Đã vượt ngân sách ${b.categoryName} (${b.percentage}%).`
          : `Sắp vượt ngân sách ${b.categoryName} (${b.percentage}%).`,
        action: `Giảm chi tiêu ${b.categoryName} khoảng 15% để tiết kiệm ${formatVND(reduce)}/tháng.`,
        potentialSaving: reduce,
      });
    });

    if (ctx.topExpenseCategory && ctx.summary.monthlyExpense > 0) {
      const pct = Math.round((ctx.topExpenseCategory.amount / ctx.summary.monthlyExpense) * 100);
      if (pct > 35) {
        const saving = Math.round(ctx.topExpenseCategory.amount * 0.2);
        recs.push({
          priority: 'medium',
          title: `Tối ưu chi tiêu ${ctx.topExpenseCategory.name}`,
          description: `${ctx.topExpenseCategory.name} chiếm ${pct}% tổng chi tiêu – quá cao so với mức khuyến nghị 30%.`,
          action: `Giảm 20% chi tiêu ${ctx.topExpenseCategory.name} để tiết kiệm ${formatVND(saving)}/tháng.`,
          potentialSaving: saving,
        });
      }
    }

    ctx.savingGoals.filter(g => g.status === 'ACTIVE' && g.progress < 50).forEach(g => {
      recs.push({
        priority: 'low',
        title: `Đẩy nhanh mục tiêu "${g.title}"`,
        description: `Mục tiêu mới đạt ${g.progress}%. Cần nạp thêm ${formatVND(g.targetAmount - g.currentAmount)}.`,
        action: 'Thiết lập nạp tiền định kỳ vào mục tiêu tiết kiệm.',
      });
    });

    if (ctx.expenseChangePercent > 15) {
      recs.push({
        priority: 'high',
        title: 'Chi tiêu tăng đột biến',
        description: `Chi tiêu tăng ${ctx.expenseChangePercent}% so với tháng trước.`,
        action: 'Xem lại giao dịch lớn và cắt giảm chi tiêu không cần thiết.',
      });
    }

    if (recs.length === 0) {
      recs.push({
        priority: 'low',
        title: 'Tài chính ổn định',
        description: 'Tình hình tài chính của bạn đang được quản lý tốt. Tiếp tục duy trì thói quen!',
        action: 'Xem xét đặt thêm mục tiêu tiết kiệm dài hạn.',
      });
    }

    return recs.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
}
