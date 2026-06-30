import { BudgetService } from '../budget.service';
import { formatVND } from '../../config/ai';

export interface BudgetForecast {
  categoryName: string;
  categoryId: string | null;
  limit: number;
  spent: number;
  dailyRate: number;
  projectedSpend: number;
  daysRemaining: number;
  daysUntilExceed: number | null;
  willExceed: boolean;
  message: string;
  severity: 'OK' | 'WARNING' | 'CRITICAL';
}

export class BudgetForecastService {
  private budgetService = new BudgetService();

  async forecast(userId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const dayOfMonth = now.getMonth() + 1 === m && now.getFullYear() === y
      ? now.getDate()
      : new Date(y, m, 0).getDate();
    const daysInMonth = new Date(y, m, 0).getDate();
    const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

    const budgets = await this.budgetService.getBudgets(userId, m, y);
    const forecasts: BudgetForecast[] = budgets.map((b: any) => {
      const spent = b.spent;
      const limit = b.amount;
      const dailyRate = dayOfMonth > 0 ? spent / dayOfMonth : 0;
      const projectedSpend = Math.round(dailyRate * daysInMonth);
      const remaining = limit - spent;
      const daysUntilExceed = dailyRate > 0 && remaining > 0
        ? Math.ceil(remaining / dailyRate)
        : remaining <= 0 ? 0 : null;
      const willExceed = projectedSpend > limit;
      const categoryName = b.category?.name || 'Tổng chi tiêu';

      let severity: BudgetForecast['severity'] = 'OK';
      let message = `"${categoryName}" đang trong ngân sách. Dự kiến chi ${formatVND(projectedSpend)}/${formatVND(limit)}.`;

      if (b.status === 'EXCEEDED' || spent >= limit) {
        severity = 'CRITICAL';
        message = `"${categoryName}" đã vượt ngân sách ${formatVND(limit)} (đã chi ${formatVND(spent)}).`;
      } else if (willExceed && daysUntilExceed !== null && daysUntilExceed <= daysRemaining) {
        severity = 'WARNING';
        message = `Bạn có thể vượt ngân sách "${categoryName}" trong ${daysUntilExceed} ngày nữa (dự kiến ${formatVND(projectedSpend)}).`;
      } else if (b.percentage >= 80) {
        severity = 'WARNING';
        message = `"${categoryName}" đã dùng ${b.percentage}% ngân sách. Còn ${daysRemaining} ngày trong tháng.`;
      }

      return {
        categoryName,
        categoryId: b.categoryId,
        limit,
        spent,
        dailyRate: Math.round(dailyRate),
        projectedSpend,
        daysRemaining,
        daysUntilExceed,
        willExceed,
        message,
        severity,
      };
    });

    const atRisk = forecasts.filter(f => f.severity !== 'OK');

    return {
      month: m,
      year: y,
      dayOfMonth,
      daysInMonth,
      forecasts,
      atRiskCount: atRisk.length,
      summary: atRisk.length > 0
        ? `Có ${atRisk.length} ngân sách cần chú ý trong tháng ${m}/${y}.`
        : `Tất cả ngân sách tháng ${m}/${y} đang được kiểm soát tốt.`,
    };
  }
}
