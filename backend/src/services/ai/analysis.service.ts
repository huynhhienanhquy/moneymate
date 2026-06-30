import { ContextBuilderService, FinancialContext } from './context-builder.service';
import { LlmProvider } from './llm.provider';
import { formatVND } from '../../config/ai';

export interface ExpenseInsight {
  type: 'increase' | 'decrease' | 'warning' | 'positive' | 'info';
  title: string;
  message: string;
  category?: string;
  value?: number;
}

export class AnalysisService {
  private contextBuilder = new ContextBuilderService();
  private llm = new LlmProvider();

  async analyzeExpenses(userId: string, month?: number, year?: number) {
    const ctx = await this.contextBuilder.build(userId, month, year);
    const insights = this.generateRuleBasedInsights(ctx);

    let aiSummary = '';
    if (this.llm.isAvailable()) {
      aiSummary = await this.llm.chat(
        [{ role: 'user', content: 'Phân tích chi tiêu tháng này và đưa ra 3 nhận xét ngắn gọn bằng tiếng Việt.' }],
        `Bạn là cố vấn tài chính. Dữ liệu:\n${this.contextBuilder.toPromptText(ctx)}`
      );
    }

    return {
      month: ctx.month,
      year: ctx.year,
      summary: ctx.summary,
      topCategories: ctx.categoryExpenses.slice(0, 5),
      expenseChangePercent: ctx.expenseChangePercent,
      insights,
      aiSummary: aiSummary || this.buildFallbackSummary(ctx),
      poweredBy: this.llm.isAvailable() ? 'openai' : 'rules',
    };
  }

  private generateRuleBasedInsights(ctx: FinancialContext): ExpenseInsight[] {
    const insights: ExpenseInsight[] = [];

    if (ctx.expenseChangePercent > 10) {
      insights.push({
        type: 'increase',
        title: 'Chi tiêu tăng',
        message: `Bạn đã chi tiêu nhiều hơn ${ctx.expenseChangePercent}% so với tháng trước.`,
        value: ctx.expenseChangePercent,
      });
    } else if (ctx.expenseChangePercent < -5) {
      insights.push({
        type: 'positive',
        title: 'Chi tiêu giảm',
        message: `Tuyệt vời! Chi tiêu giảm ${Math.abs(ctx.expenseChangePercent)}% so với tháng trước.`,
        value: ctx.expenseChangePercent,
      });
    }

    if (ctx.topExpenseCategory && ctx.summary.monthlyExpense > 0) {
      const pct = Math.round((ctx.topExpenseCategory.amount / ctx.summary.monthlyExpense) * 100);
      insights.push({
        type: 'info',
        title: 'Danh mục chi nhiều nhất',
        message: `${ctx.topExpenseCategory.name} chiếm ${pct}% tổng chi tiêu (${formatVND(ctx.topExpenseCategory.amount)}).`,
        category: ctx.topExpenseCategory.name,
        value: pct,
      });
    }

    ctx.budgets.filter(b => b.status === 'EXCEEDED').forEach(b => {
      insights.push({
        type: 'warning',
        title: 'Vượt ngân sách',
        message: `Danh mục "${b.categoryName}" đã vượt ngân sách (${b.percentage}%).`,
        category: b.categoryName,
      });
    });

    ctx.budgets.filter(b => b.status === 'WARNING').forEach(b => {
      insights.push({
        type: 'warning',
        title: 'Sắp vượt ngân sách',
        message: `"${b.categoryName}" đã dùng ${b.percentage}% ngân sách tháng này.`,
        category: b.categoryName,
      });
    });

    if (ctx.summary.savingsRate < 10 && ctx.summary.monthlyIncome > 0) {
      insights.push({
        type: 'warning',
        title: 'Tỷ lệ tiết kiệm thấp',
        message: `Tỷ lệ tiết kiệm chỉ ${ctx.summary.savingsRate}%. Nên mục tiêu ít nhất 20%.`,
        value: ctx.summary.savingsRate,
      });
    } else if (ctx.summary.savingsRate >= 20) {
      insights.push({
        type: 'positive',
        title: 'Tiết kiệm tốt',
        message: `Bạn đang tiết kiệm ${ctx.summary.savingsRate}% thu nhập. Rất tốt!`,
        value: ctx.summary.savingsRate,
      });
    }

    // Compare categories month over month
    if (ctx.categoryExpenses.length >= 2) {
      const top = ctx.categoryExpenses[0];
      insights.push({
        type: 'info',
        title: 'Gợi ý tối ưu',
        message: `Xem xét giảm chi tiêu "${top.name}" nếu muốn tăng tiết kiệm thêm ${formatVND(Math.round(top.amount * 0.1))}/tháng.`,
        category: top.name,
      });
    }

    return insights;
  }

  private buildFallbackSummary(ctx: FinancialContext): string {
    const parts = [];
    if (ctx.topExpenseCategory) {
      parts.push(`Danh mục chi nhiều nhất là ${ctx.topExpenseCategory.name} (${formatVND(ctx.topExpenseCategory.amount)}).`);
    }
    if (ctx.expenseChangePercent !== 0) {
      parts.push(`Chi tiêu ${ctx.expenseChangePercent > 0 ? 'tăng' : 'giảm'} ${Math.abs(ctx.expenseChangePercent)}% so với tháng trước.`);
    }
    parts.push(`Tỷ lệ tiết kiệm: ${ctx.summary.savingsRate}%.`);
    return parts.join(' ');
  }
}
