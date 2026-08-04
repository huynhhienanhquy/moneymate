import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet, Sparkles, Loader2, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import api from '@/shared/api/client';
import { useAuthStore } from '@/shared/stores/auth.store';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['#2a95ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6'];

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendColor?: string;
}> = ({ title, value, icon, iconBg, trend, trendColor }) => (
  <div className="app-card app-card-hover p-5 flex items-start gap-4">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="mt-1 text-xl font-extrabold text-slate-950 dark:text-slate-100 truncate">{value}</p>
      {trend && <p className={`text-xs mt-1 font-medium ${trendColor}`}>{trend}</p>}
    </div>
  </div>
);

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
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-slate-400 text-sm">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  const netWorth: number = dashData?.netWorth || 0;
  const monthlyIncome: number = dashData?.monthlyIncome || 0;
  const monthlyExpense: number = dashData?.monthlyExpense || 0;
  const monthlySavings: number = dashData?.monthlySavings || 0;
  const actualExpense: number = dashData?.actualExpense || 0;
  const recurringExpense: number = dashData?.recurringExpense || 0;
  const walletBalanceTotal: number = dashData?.walletBalanceTotal || 0;
  const recentTransactions: any[] = dashData?.recentTransactions || [];
  const categoryExpenses: any[] = reportData?.categoryExpenses || [];

  const barData = trendData.map((item: any) => ({
    name: item.label || (item.month ? MONTHS[item.month - 1] : ''),
    income: item.income,
    expense: item.expense,
  }));

  const prevMonthIdx = trendData.length >= 2 ? trendData.length - 2 : -1;
  const prevIncome = prevMonthIdx >= 0 ? Number(trendData[prevMonthIdx].income) : 0;
  const incomeTrend = prevIncome > 0 && monthlyIncome > 0
    ? `${monthlyIncome >= prevIncome ? '+' : '-'}${Math.abs(Math.round(((monthlyIncome - prevIncome) / prevIncome) * 100))}% so với tháng trước`
    : '';

  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="app-shell-card overflow-hidden p-6 md:p-8 relative">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl" />
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Dashboard</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
          Xin chào, {user?.fullName?.split(' ').pop() || 'bạn'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Đây là tổng quan tài chính tháng {now.getMonth() + 1}/{now.getFullYear()} của bạn.
        </p>
      </div>

      {/* AI Insight Banner */}
      {aiInsight?.insights?.[0] && (
        <Link to="/ai" className="app-card app-card-hover flex items-center gap-4 p-4 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 flex-shrink-0">
            <Sparkles size={20} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-300">{aiInsight.insights[0].title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{aiInsight.insights[0].message}</p>
          </div>
          <ChevronRight size={16} className="text-brand-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
        </Link>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Tổng tài sản"
          value={formatVND(netWorth)}
          icon={<Wallet size={20} className="text-brand-400" />}
          iconBg="bg-brand-500/10"
          trend="Tổng số dư hiện có trong tất cả ví"
          trendColor="text-slate-500 dark:text-slate-400"
        />
        <StatCard
          title="Thu nhập tháng này"
          value={formatVND(monthlyIncome)}
          icon={<TrendingUp size={20} className="text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          trend={incomeTrend || undefined}
          trendColor={monthlyIncome >= prevIncome ? 'text-emerald-400' : 'text-rose-400'}
        />
        <StatCard
          title="Chi tiêu tháng này"
          value={formatVND(monthlyExpense)}
          icon={<TrendingDown size={20} className="text-rose-400" />}
          iconBg="bg-rose-500/10"
          trend={`Đã chi ${formatVND(actualExpense)} + định kỳ ${formatVND(recurringExpense)}`}
          trendColor="text-slate-500 dark:text-slate-400"
        />
        <StatCard
          title="Tiết kiệm tháng này"
          value={formatVND(monthlySavings)}
          icon={<Sparkles size={20} className="text-amber-400" />}
          iconBg="bg-amber-500/10"
          trend={`Tài sản ${formatVND(walletBalanceTotal)} + thu nhập ${formatVND(monthlyIncome)} - chi ${formatVND(monthlyExpense)}`}
          trendColor={savingsRate > 20 ? 'text-emerald-400' : 'text-amber-400'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie Chart - Category Breakdown */}
        <div className="app-card lg:col-span-2 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">Chi tiêu theo danh mục</h2>
          {categoryExpenses.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell key={entry.id} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatVND(value)}
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-2">
                {categoryExpenses.slice(0, 5).map((cat, i) => (
                  <li key={cat.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: cat.color || PIE_COLORS[i % PIE_COLORS.length] }}></span>
                      {cat.name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{formatVND(cat.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Chưa có dữ liệu chi tiêu tháng này
            </div>
          )}
        </div>

        {/* Bar Chart - Income vs Expense */}
        <div className="app-card lg:col-span-3 p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">Thu nhập & Chi tiêu 6 tháng</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                formatter={(value: any) => formatVND(value)}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="app-card p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">Giao dịch gần đây</h2>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((tx: any) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                  >
                    {isIncome
                      ? <ArrowUpRight size={16} className="text-emerald-400" />
                      : <ArrowDownLeft size={16} className="text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{tx.note || tx.category?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {tx.category?.name} · {new Date(tx.transactionDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isIncome ? '+' : '-'}{formatVND(Number(tx.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <Wallet size={36} className="mb-3 opacity-40" />
            <p className="text-sm">Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
