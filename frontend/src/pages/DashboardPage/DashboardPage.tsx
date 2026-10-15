import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, ChevronRight, PiggyBank, ReceiptText, Sparkles, Target, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AppCard from '@/components/common/AppCard/AppCard';
import AppButton from '@/components/common/AppButton/AppButton';
import PageHeader from '@/components/common/PageHeader/PageHeader';
import { APP_ROUTES } from '@/constants/routes';
import { chartTheme } from '@/theme/charts';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { formatVND } from '@/utils/formatCurrency';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const PIE_COLORS = chartTheme.palette;

const StatCard = ({ title, value, icon, tone, caption }: { title: string; value: number; icon: ReactNode; tone: 'income' | 'expense' | 'savings'; caption: string }) => {
  const colors = {
    income: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    expense: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    savings: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
  };
  return <div className="app-stat-card flex min-h-[156px] flex-col justify-between p-4 sm:min-h-[188px] sm:p-5">
    <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-medium text-ui-muted sm:text-xs">{title}</p><span className={`flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-9 ${colors[tone]}`}>{icon}</span></div>
    <p data-money className="my-3 break-words text-lg font-extrabold leading-tight tracking-tight text-ui-text sm:text-[clamp(1.2rem,1.65vw,1.65rem)]">{formatVND(value)}</p>
    <p className="text-[10px] leading-5 text-ui-muted">{caption}</p>
  </div>;
};

const DashboardPage = () => {
  const reducedMotion = useReducedMotion();
  const { user } = useAuthStore();
  const now = new Date();
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/transactions/dashboard').then(r => r.data.data), staleTime: 60_000 });
  const reportQuery = useQuery({ queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()], queryFn: () => api.get('/transactions/report', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }).then(r => r.data.data), staleTime: 60_000 });
  const trendQuery = useQuery({ queryKey: ['monthly-trend', 6], queryFn: () => api.get('/transactions/trend', { params: { months: 6 } }).then(r => r.data.data), staleTime: 60_000 });
  const { data: aiInsight } = useQuery({ queryKey: ['ai-analysis-dash'], queryFn: () => api.get('/ai/analyze/expenses').then(r => r.data.data), staleTime: 120_000 });

  if (dashboardQuery.isLoading || reportQuery.isLoading || trendQuery.isLoading) {
    return <div role="status" className="space-y-6"><p className="text-sm font-medium text-ui-muted">Đang tải tổng quan tài chính...</p><div className="app-skeleton h-20" /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(key => <div key={key} className="app-skeleton h-44" />)}</div><div className="app-skeleton h-80" /></div>;
  }
  if (dashboardQuery.isError || reportQuery.isError || trendQuery.isError) {
    return <AppCard padding="none" className="flex min-h-empty-half flex-col items-center justify-center gap-3 p-8 text-center" role="alert">
      <span className="dashboard-empty-icon"><BarChart3 className="size-6" /></span>
      <p className="text-base font-bold text-rose-600 dark:text-rose-400">Không thể tải tổng quan tài chính</p>
      <p className="max-w-sm text-sm text-ui-muted">Vui lòng kiểm tra kết nối và thử lại để xem số liệu mới nhất của bạn.</p>
      <AppButton onClick={() => { void dashboardQuery.refetch(); void reportQuery.refetch(); void trendQuery.refetch(); }}>Thử lại</AppButton>
    </AppCard>;
  }

  const dashData = dashboardQuery.data;
  const netWorth = Number(dashData?.netWorth ?? 0);
  const monthlyIncome = Number(dashData?.monthlyIncome ?? 0);
  const monthlyExpense = Number(dashData?.monthlyExpense ?? 0);
  const monthlySavings = Number(dashData?.monthlySavings ?? 0);
  const recentTransactions: any[] = (dashData?.recentTransactions || []).filter((tx: any) => tx.type !== 'TRANSFER');
  const categoryExpenses: any[] = reportQuery.data?.categoryExpenses || [];
  const categoryTotal = categoryExpenses.reduce((total, category) => total + Number(category.amount), 0);
  const barData = (trendQuery.data ?? []).map((item: any) => ({ name: item.label || (item.month ? MONTHS[item.month - 1] : ''), income: item.income, expense: item.expense }));
  const hasTrend = barData.some((item: any) => Number(item.income) > 0 || Number(item.expense) > 0);

  return <div className="dashboard-page space-y-6 animate-fade-in">
    <PageHeader size="hero" eyebrow="Không gian tài chính của bạn" title="Tổng quan tài chính"
      description={`Chào ${user?.fullName?.split(' ').pop() || 'bạn'}, cùng nhìn lại bức tranh tài chính hôm nay.`}
      actions={<><Link to={APP_ROUTES.reports} className="app-secondary-button"><BarChart3 className="size-4" /> Xem báo cáo</Link><Link to={APP_ROUTES.transactions} className="app-primary-button"><ReceiptText className="size-4" /> Quản lý giao dịch</Link></>} />

    <div className="flex items-center justify-between gap-2 border-b border-ui-border pb-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-ui-text"><CalendarDays className="size-4 text-ui-muted" />Tháng {now.getMonth() + 1}, {now.getFullYear()}</div>
      <span className="text-[11px] text-ui-muted">Đơn vị: VND</span>
    </div>

    <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <section className="dashboard-balance" aria-label="Tổng tài sản">
        <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-blue-100">Tổng tài sản</p><Wallet className="size-5 text-blue-200" /></div>
        <p data-money className="my-3 break-words text-lg font-extrabold leading-tight tracking-tight sm:text-[clamp(1.2rem,1.65vw,1.65rem)]">{formatVND(netWorth)}</p>
        <Link to={APP_ROUTES.wallets} className="flex items-center justify-between border-t border-white/15 pt-3 text-[10px] font-medium text-blue-100 transition-colors hover:text-white">Số dư trên các ví<ArrowUpRight className="size-3.5" /></Link>
      </section>
      <StatCard title="Thu nhập tháng này" value={monthlyIncome} icon={<ArrowDownLeft className="size-4.5" />} tone="income" caption="Tổng các khoản thu trong tháng" />
      <StatCard title="Chi tiêu tháng này" value={monthlyExpense} icon={<ArrowUpRight className="size-4.5" />} tone="expense" caption="Tổng các khoản chi trong tháng" />
      <StatCard title="Tiết kiệm tháng này" value={monthlySavings} icon={<PiggyBank className="size-4.5" />} tone="savings" caption="Theo tổng quan tài chính hiện tại" />
    </div>

    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-5">
      <AppCard padding="none" className="min-w-0 p-5 sm:p-6 xl:col-span-3">
        <div className="dashboard-chart-heading"><div><h2>Dòng tiền của bạn</h2><p>Thu nhập và chi tiêu trong 6 tháng gần nhất</p></div><div className="flex items-center gap-3 pt-1 text-[10px] text-ui-muted"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-income" />Thu nhập</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-savings" />Chi tiêu</span></div></div>
        {hasTrend ? <div role="img" aria-label="Biểu đồ so sánh thu nhập và chi tiêu 6 tháng" className="min-w-0">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barGap={5} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 5" stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: chartTheme.muted, fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: chartTheme.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}tr`} />
              <Tooltip contentStyle={chartTheme.tooltip} cursor={{ fill: 'rgb(var(--ui-raised))' }} formatter={(value: any) => formatVND(Number(value))} />
              <Bar dataKey="income" name="Thu nhập" fill={chartTheme.income} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={!reducedMotion} animationDuration={650} animationEasing="ease-out" />
              <Bar dataKey="expense" name="Chi tiêu" fill={chartTheme.savings} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={!reducedMotion} animationBegin={80} animationDuration={650} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div> : <div className="dashboard-empty"><span className="dashboard-empty-icon"><BarChart3 className="size-6" /></span><div><p className="text-sm font-semibold text-ui-text">Bắt đầu bức tranh tài chính của bạn</p><p className="mt-1 max-w-xs text-xs leading-5">Biểu đồ sẽ xuất hiện khi bạn có giao dịch thu nhập hoặc chi tiêu.</p></div><Link to={APP_ROUTES.transactions} className="text-xs font-semibold text-blue-600 dark:text-blue-300">Đến trang giao dịch <span aria-hidden="true">→</span></Link></div>}
      </AppCard>

      <AppCard padding="none" className="min-w-0 p-5 sm:p-6 xl:col-span-2">
        <div className="dashboard-chart-heading"><div><h2>Chi tiêu theo danh mục</h2><p>Tiền của bạn đang đi đâu?</p></div><span className="app-badge-neutral">Tháng này</span></div>
        {categoryTotal > 0 ? <>
          <div className="relative" role="img" aria-label={`Phân bổ chi tiêu theo danh mục, tổng ${formatVND(categoryTotal)}`}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={categoryExpenses} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={82} paddingAngle={4} strokeWidth={0} isAnimationActive={!reducedMotion} animationDuration={750} animationEasing="ease-out">
                {categoryExpenses.map((entry, index) => <Cell key={entry.id} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />)}
              </Pie><Tooltip formatter={(value: any) => formatVND(Number(value))} contentStyle={chartTheme.tooltip} /></PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[10px] text-ui-muted">Tổng chi tiêu</span><span className="mt-1 max-w-[115px] break-words text-center text-sm font-extrabold text-ui-text" data-money>{formatVND(categoryTotal)}</span></div>
          </div>
          <ul className="mt-1 space-y-3">{categoryExpenses.slice(0, 4).map((cat, index) => <li key={cat.id} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2 text-ui-muted"><span className="size-2 shrink-0 rounded-full" style={{ background: cat.color || PIE_COLORS[index % PIE_COLORS.length] }} /><span className="truncate">{cat.name}</span></span><span className="shrink-0 font-semibold text-ui-text">{formatVND(Number(cat.amount))}<span className="ml-2 inline-block w-8 text-right font-normal text-ui-muted">{Math.round(Number(cat.amount) / categoryTotal * 100)}%</span></span></li>)}</ul>
        </> : <div className="dashboard-empty"><span className="dashboard-empty-icon"><Wallet className="size-6" /></span><div><p className="text-sm font-semibold text-ui-text">Chưa có chi tiêu tháng này</p><p className="mt-1 text-xs leading-5">Các danh mục sẽ xuất hiện sau khoản chi đầu tiên.</p></div></div>}
      </AppCard>
    </div>

    {aiInsight?.insights?.[0] && <Link to={APP_ROUTES.aiAdvisor} className="dashboard-insight group">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"><Sparkles className="size-4.5" /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-bold text-ui-text"><span className="mr-2 text-blue-600 dark:text-blue-300">Góc nhìn AI</span>{aiInsight.insights[0].title}</p><p className="mt-1 text-xs leading-5 text-ui-muted">{aiInsight.insights[0].message || aiInsight.insights[0].description}</p></div><ChevronRight className="mt-2 size-4 shrink-0 text-blue-600 dark:text-blue-300" />
    </Link>}

    <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-5">
      <AppCard padding="none" className="min-w-0 p-5 sm:p-6 xl:col-span-3">
        <div className="dashboard-chart-heading"><div><h2>Giao dịch gần đây</h2><p>Những chuyển động tài chính mới nhất</p></div><Link to={APP_ROUTES.transactions} className="flex min-h-8 items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-300">Xem tất cả <ChevronRight className="size-3.5" /></Link></div>
        {recentTransactions.length > 0 ? <div>{recentTransactions.map(tx => {
          const isIncome = tx.type === 'INCOME';
          return <div key={tx.id} className="dashboard-transaction">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'}`}>{isIncome ? <ArrowDownLeft className="size-4.5" /> : <ArrowUpRight className="size-4.5" />}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ui-text">{tx.note || tx.category?.name}</p><p className="mt-1 text-[10px] text-ui-muted">{tx.category?.name} · {new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</p></div>
            <span data-money className={`max-w-full break-words text-right text-xs font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-ui-text'}`}>{isIncome ? '+' : '−'}{formatVND(Number(tx.amount))}</span>
          </div>;
        })}</div> : <div className="dashboard-empty min-h-[200px]"><span className="dashboard-empty-icon"><ReceiptText className="size-6" /></span><p className="max-w-xs text-xs leading-5">Chưa có giao dịch nào. Hãy ghi lại giao dịch đầu tiên để bắt đầu.</p><Link to={APP_ROUTES.transactions} className="app-secondary-button">Đến trang giao dịch<ArrowRight className="size-4" /></Link></div>}
      </AppCard>
      <AppCard padding="none" className="p-5 sm:p-6 xl:col-span-2">
        <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Target className="size-5" /></span>
        <h2 className="text-base font-bold text-ui-text">Từng bước, gần hơn mục tiêu</h2>
        <p className="mt-2 text-xs leading-6 text-ui-muted">Một kế hoạch rõ ràng hôm nay giúp bạn chủ động hơn với ngày mai.</p>
        <div className="mt-5 space-y-2">
          <Link to={APP_ROUTES.budgets} className="flex min-h-12 items-center gap-3 rounded-xl border border-ui-border px-3 text-xs font-semibold text-ui-text transition-colors hover:bg-ui-raised"><PiggyBank className="size-4 text-ui-muted" /><span className="flex-1">Lập ngân sách chi tiêu</span><ChevronRight className="size-3.5 text-ui-muted" /></Link>
          <Link to={APP_ROUTES.savingGoals} className="flex min-h-12 items-center gap-3 rounded-xl border border-ui-border px-3 text-xs font-semibold text-ui-text transition-colors hover:bg-ui-raised"><ArrowDownRight className="size-4 text-ui-muted" /><span className="flex-1">Đặt mục tiêu tiết kiệm</span><ChevronRight className="size-3.5 text-ui-muted" /></Link>
        </div>
      </AppCard>
    </div>
    <p className="pt-1 text-center text-[10px] text-slate-400 dark:text-slate-500">MoneyMate · Từng bước vững vàng hơn với tài chính của bạn</p>
  </div>;
};

export default DashboardPage;
