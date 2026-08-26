import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppCard from '@/components/common/AppCard/AppCard';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, Wallet, Sparkles, Loader2, ArrowUpRight, ArrowDownLeft, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import api from '@/services/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { formatVND } from '@/utils/formatCurrency';

const PIE_COLORS = ['#2a95ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6'];

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  variant: 'asset' | 'expense' | 'savings';
  trend?: string;
  trendColor?: string;
}> = ({ title, value, icon, iconBg, variant, trend, trendColor }) => {
  const variantClass = {
    asset: 'app-stat-card-asset',
    expense: 'app-stat-card-expense',
    savings: 'app-stat-card-savings',
  }[variant];

  return (
    <div className={`app-stat-card ${variantClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0 shadow-md ${iconBg}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <p className={`text-xs font-semibold ${trendColor || 'text-slate-500 dark:text-slate-400'} truncate`}>
            {trend}
          </p>
        </div>
      )}
    </div>
  );
};

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/transactions/dashboard').then(r => r.data.data),
    staleTime: 60_000,
  });

  const now = new Date();
  const { data: reportData } = useQuery({
    queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      api.get('/transactions/report', { params: { month: now.getMonth() + 1, year: now.getFullYear() } })
        .then(r => r.data.data),
    staleTime: 60_000,
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ['monthly-trend', 6],
    queryFn: () => api.get('/transactions/trend', { params: { months: 6 } }).then(r => r.data.data),
    staleTime: 60_000,
  });

  const { data: aiInsight } = useQuery({
    queryKey: ['ai-analysis-dash'],
    queryFn: () => api.get('/ai/analyze/expenses').then(r => r.data.data),
    staleTime: 120_000,
  });

  if (dashLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-brand-500" />
          <p className="text-slate-400 font-medium text-sm">Đang tải tổng quan tài chính...</p>
        </div>
      </div>
    );
  }

  const netWorth: number = dashData?.netWorth || 0;
  const monthlyExpense: number = dashData?.monthlyExpense || 0;
  const monthlySavings = netWorth - monthlyExpense;
  const actualExpense: number = dashData?.actualExpense || 0;
  const recentTransactions: any[] = dashData?.recentTransactions || [];
  const categoryExpenses: any[] = reportData?.categoryExpenses || [];

  const barData = trendData.map((item: any) => ({
    name: item.label || (item.month ? MONTHS[item.month - 1] : ''),
    income: item.income,
    expense: item.expense,
  }));

  return (
    <div className="dashboard-page space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="dashboard-hero app-page-header">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap size={14} /> Tổng quan tài chính
            </div>
            <AppTitle unstyled level={1} className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Xin chào, {user?.fullName?.split(' ').pop() || 'bạn'} 👋
            </AppTitle>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              Báo cáo thông minh cho tháng <span className="font-bold text-slate-800 dark:text-slate-200">{now.getMonth() + 1}/{now.getFullYear()}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/transactions" className="app-primary-button shadow-md">
              + Thêm giao dịch
            </Link>
          </div>
        </div>
      {/* AI Insight Banner */}
      {aiInsight?.insights?.[0] && (
        <Link to="/ai" className="dashboard-insight app-card flex items-center gap-4 p-3.5 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-lg shadow-brand-500/25 flex-shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="app-badge app-badge-info">AI Advisor</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{aiInsight.insights[0].title}</p>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{aiInsight.insights[0].message}</p>
          </div>
          <ChevronRight size={18} className="text-brand-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </Link>
      )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Tổng tài sản"
          value={formatVND(netWorth)}
          icon={<Wallet size={24} className="text-brand-500" />}
          iconBg="bg-brand-500/10"
          variant="asset"
          trend="Số dư khả dụng trong tất cả ví"
          trendColor="text-slate-500 dark:text-slate-400"
        />
        <StatCard
          title="Chi tiêu tháng này"
          value={formatVND(monthlyExpense)}
          icon={<TrendingDown size={24} className="text-rose-500" />}
          iconBg="bg-rose-500/10"
          variant="expense"
          trend={`Chi trực tiếp: ${formatVND(actualExpense)}`}
          trendColor="text-slate-500 dark:text-slate-400"
        />
        <StatCard
          title="Tiết kiệm tháng này"
          value={formatVND(monthlySavings)}
          icon={<Sparkles size={24} className="text-amber-500" />}
          iconBg="bg-amber-500/10"
          variant="savings"
          trend="Tổng tài sản - chi tiêu tháng này"
          trendColor={monthlySavings >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie Chart - Category Breakdown */}
        <AppCard padding="none" className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <AppTitle unstyled level={2} className="text-base font-bold text-slate-900 dark:text-slate-100">Chi tiêu theo danh mục</AppTitle>
              <span className="text-xs font-semibold text-slate-400 uppercase">Tháng này</span>
            </div>
            {categoryExpenses.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell key={entry.id} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatVND(value)}
                      contentStyle={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-4 space-y-2.5">
                  {categoryExpenses.slice(0, 5).map((cat, i) => (
                    <li key={cat.id} className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: cat.color || PIE_COLORS[i % PIE_COLORS.length] }}></span>
                        {cat.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatVND(cat.amount)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-slate-400 text-sm">
                <Wallet size={36} className="mb-2 opacity-30" />
                <p>Chưa có dữ liệu chi tiêu tháng này</p>
              </div>
            )}
          </div>
        </AppCard>

        {/* Bar Chart - Income vs Expense */}
        <AppCard padding="none" className="lg:col-span-3 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <AppTitle unstyled level={2} className="text-base font-bold text-slate-900 dark:text-slate-100">Thu nhập & Chi tiêu 6 tháng</AppTitle>
              <span className="text-xs font-semibold text-brand-500 uppercase">Xu hướng</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: any) => formatVND(value)}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppCard>
      </div>

      {/* Recent Transactions */}
      <AppCard padding="none" className="p-6">
        <div className="flex items-center justify-between mb-5">
          <AppTitle unstyled level={2} className="text-base font-bold text-slate-900 dark:text-slate-100">Giao dịch gần đây</AppTitle>
          <Link to="/transactions" className="text-xs font-bold text-brand-500 hover:text-brand-400 transition">
            Xem tất cả →
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="space-y-2.5">
            {recentTransactions.map((tx: any) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <div key={tx.id} className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:border-brand-300 dark:hover:border-slate-700 transition-all group">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${isIncome ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}
                  >
                    {isIncome
                      ? <ArrowUpRight size={18} />
                      : <ArrowDownLeft size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{tx.note || tx.category?.name}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {tx.category?.name} · {new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`text-base font-extrabold flex-shrink-0 ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isIncome ? '+' : '-'}{formatVND(Number(tx.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Wallet size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!</p>
          </div>
        )}
      </AppCard>
    </div>
  );
};

export default DashboardPage;
