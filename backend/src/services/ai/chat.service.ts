import { ContextBuilderService } from './context-builder.service';
import { LlmProvider, ChatMessage } from './llm.provider';
import { formatVND } from '../../config/ai';

export class ChatService {
  private contextBuilder = new ContextBuilderService();
  private llm = new LlmProvider();

  async chat(userId: string, message: string, history: ChatMessage[] = []) {
    const ctx = await this.contextBuilder.build(userId);
    const contextText = this.contextBuilder.toPromptText(ctx);

    if (this.llm.isAvailable()) {
      const reply = await this.llm.chat(
        [...history.slice(-6), { role: 'user', content: message }],
        `Bạn là MoneyMate AI – trợ lý tài chính cá nhân tiếng Việt. Trả lời ngắn gọn, thực tế, dựa trên dữ liệu người dùng. Không bịa số liệu.\n\nDữ liệu hiện tại:\n${contextText}`
      );
      if (reply) {
        return { reply, poweredBy: 'openai' as const, suggestions: this.getSuggestions(ctx) };
      }
    }

    const reply = this.ruleBasedReply(message, ctx);
    return { reply, poweredBy: 'rules' as const, suggestions: this.getSuggestions(ctx) };
  }

  private ruleBasedReply(message: string, ctx: Awaited<ReturnType<ContextBuilderService['build']>>): string {
    const q = message.toLowerCase();

    if (q.includes('chi nhiều') || q.includes('chi tiêu nhiều') || q.includes('spend') || q.includes('most')) {
      if (ctx.topExpenseCategory) {
        const pct = ctx.summary.monthlyExpense > 0
          ? Math.round((ctx.topExpenseCategory.amount / ctx.summary.monthlyExpense) * 100)
          : 0;
        return `${ctx.topExpenseCategory.name} là danh mục chi nhiều nhất tháng ${ctx.month}/${ctx.year}, chiếm ${pct}% tổng chi tiêu (${formatVND(ctx.topExpenseCategory.amount)}).`;
      }
      return 'Chưa có dữ liệu chi tiêu tháng này.';
    }

    if (q.includes('tiết kiệm') || q.includes('saving')) {
      return `Tháng này bạn tiết kiệm được ${formatVND(ctx.summary.monthlySavings)} (${ctx.summary.savingsRate}% thu nhập). ${ctx.summary.savingsRate >= 20 ? 'Rất tốt!' : 'Nên mục tiêu ít nhất 20%.'}`;
    }

    if (q.includes('ngân sách') || q.includes('budget') || q.includes('vượt')) {
      const atRisk = ctx.budgets.filter(b => b.status !== 'OK');
      if (atRisk.length === 0) return 'Tất cả ngân sách tháng này đang trong tầm kiểm soát.';
      return atRisk.map(b => `"${b.categoryName}": ${b.percentage}% ngân sách (${b.status})`).join('. ');
    }

    if (q.includes('thu nhập') || q.includes('income')) {
      return `Thu nhập tháng ${ctx.month}/${ctx.year}: ${formatVND(ctx.summary.monthlyIncome)}. Chi tiêu: ${formatVND(ctx.summary.monthlyExpense)}.`;
    }

    if (q.includes('tài sản') || q.includes('net worth') || q.includes('tổng')) {
      return `Tổng tài sản hiện tại: ${formatVND(ctx.summary.netWorth)}.`;
    }

    if (q.includes('mục tiêu') || q.includes('goal')) {
      if (ctx.savingGoals.length === 0) return 'Bạn chưa có mục tiêu tiết kiệm nào. Hãy tạo mục tiêu tại trang Mục tiêu.';
      return ctx.savingGoals.map(g => `"${g.title}": ${g.progress}% (${g.status})`).join('. ');
    }

    if (q.includes('so sánh') || q.includes('tháng trước')) {
      const dir = ctx.expenseChangePercent >= 0 ? 'tăng' : 'giảm';
      return `Chi tiêu tháng này ${dir} ${Math.abs(ctx.expenseChangePercent)}% so với tháng trước (${formatVND(ctx.summary.monthlyExpense)} vs ${formatVND(ctx.previousMonthExpense)}).`;
    }

    return `Tháng ${ctx.month}/${ctx.year}: Thu ${formatVND(ctx.summary.monthlyIncome)}, chi ${formatVND(ctx.summary.monthlyExpense)}, tiết kiệm ${formatVND(ctx.summary.monthlySavings)}. Hỏi tôi về chi tiêu, ngân sách, mục tiêu hoặc tiết kiệm nhé!`;
  }

  private getSuggestions(ctx: Awaited<ReturnType<ContextBuilderService['build']>>): string[] {
    return [
      'Tháng này tôi chi nhiều nhất ở đâu?',
      'Tôi có vượt ngân sách không?',
      'Tỷ lệ tiết kiệm của tôi thế nào?',
      'So sánh chi tiêu với tháng trước',
    ];
  }
}
