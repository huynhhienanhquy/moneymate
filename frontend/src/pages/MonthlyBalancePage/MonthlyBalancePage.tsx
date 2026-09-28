import { chartTheme } from '@/theme/charts';
import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppCard from '@/components/common/AppCard/AppCard';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Loader2, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import api from '@/services/api/client';
import { formatChartValue, formatVND } from '@/utils/formatCurrency';
import PageHeader from '@/components/common/PageHeader/PageHeader';
import PeriodNavigator from '@/components/common/PeriodNavigator/PeriodNavigator';
import SummaryCard from '@/components/common/SummaryCard/SummaryCard';

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const MonthlyBalancePage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-balance-v7', year],
    queryFn: () => api.get('/transactions/report/yearly', { params: { year } }).then((r) => r.data.data),
    staleTime: 0,
  });

  const accountCreatedAt = data?.accountCreatedAt ? new Date(data.accountCreatedAt) : null;
  const now = new Date();
  const currentMonthBoundary = new Date(now.getFullYear(), now.getMonth(), 1);

  let cumulativeSavings = 0;
  const monthlyData = (data?.monthlyData || [])
    .filter((item: any) => {
      const itemDate = new Date(year, item.month - 1, 1);
      if (itemDate > currentMonthBoundary) return false;
      if (!accountCreatedAt) return true;
      const createdMonth = new Date(accountCreatedAt.getFullYear(), accountCreatedAt.getMonth(), 1);
      return itemDate >= createdMonth;
    })
    .map((item: any) => {
      const income = Number(item.walletBalance ?? item.income ?? 0);
      const expense = Number(item.expense || 0);
      const remaining = income - expense;
      cumulativeSavings += remaining;

      return {
        month: item.month,
        label: item.label || MONTHS[item.month - 1],
        income,
        expense,
        remaining,
        cumulativeSavings,
      };
    });

  const totalIncome = monthlyData.reduce((sum: number, item: any) => sum + item.income, 0);
  const totalExpense = monthlyData.reduce((sum: number, item: any) => sum + item.expense, 0);
  const averageSavings = monthlyData.length
    ? monthlyData.reduce((sum: number, item: any) => sum + item.remaining, 0) / monthlyData.length
    : 0;
  const bestMonth = monthlyData.reduce((best: any, item: any) => (!best || item.remaining > best.remaining ? item : best), null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dòng tiền"
        title="Tiết kiệm mỗi tháng"
        description="Theo dõi thặng dư tài chính tích lũy qua từng chu kỳ tháng"
        actions={<PeriodNavigator label={`Năm ${year}`} onPrevious={() => setYear((y) => y - 1)} onNext={() => setYear((y) => y + 1)} previousLabel="Năm trước" nextLabel="Năm sau" />}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2  className="size-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {monthlyData.length === 0 ? (
            <AppCard padding="none" className="flex flex-col items-center justify-center py-20 text-center">
              <WalletCards  className="size-icon-hero mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">Chưa có dữ liệu trong năm {year}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tài khoản được tạo từ {accountCreatedAt?.toLocaleDateString('vi-VN') || 'ngày đăng ký'}, nên các tháng trước đó không được tính.
              </p>
            </AppCard>
          ) : (
          <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard icon={<TrendingUp className="size-4.5" />} label="Tổng thu nhập" value={formatVND(totalIncome)} tone="green" caption="Tích lũy trong năm" />
            <SummaryCard icon={<TrendingDown className="size-4.5" />} label="Tổng chi tiêu" value={formatVND(totalExpense)} tone="red" caption="Tỷ trọng dòng tiền ra" />
            <SummaryCard icon={<WalletCards className="size-4.5" />} label="Tiết kiệm trung bình" value={formatVND(averageSavings)} tone={averageSavings >= 0 ? 'blue' : 'red'} caption={bestMonth ? `Tháng tốt nhất: ${bestMonth.label}` : 'Chưa đủ dữ liệu'} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-summary dark:bg-slate-900">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
              <AppTitle unstyled level={2} className="font-extrabold text-slate-900 dark:text-slate-100">Tiết kiệm theo tháng</AppTitle>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={chartTheme.height}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="label" tick={{ fill: chartTheme.muted, fontSize: chartTheme.tickSize }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartTheme.muted, fontSize: chartTheme.smallTickSize }} axisLine={false} tickLine={false} tickFormatter={formatChartValue} />
                <Tooltip
                  formatter={(value: any) => formatVND(Number(value))}
                  contentStyle={chartTheme.tooltip}
                />
                <Bar dataKey="remaining" name="Tiết kiệm tháng" radius={[8, 8, 0, 0]}>
                  {monthlyData.map((item: any) => (
                    <Cell key={item.month} fill={item.remaining >= 0 ? chartTheme.savings : chartTheme.expense} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-summary dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <AppTitle unstyled level={2} className="font-extrabold text-slate-900 dark:text-slate-100">Chi tiết từng tháng</AppTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Tháng</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Tổng thu nhập tháng</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Chi tiêu</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Tiết kiệm tháng</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Tổng tiền tiết kiệm được</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {monthlyData.map((item: any) => (
                    <tr key={item.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100">Tháng {item.month}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-emerald-500">{formatVND(item.income)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-rose-500">{formatVND(item.expense)}</td>
                      <td className={`px-5 py-3.5 text-right text-sm font-extrabold ${item.remaining >= 0 ? 'text-brand-500' : 'text-rose-500'}`}>
                        {formatVND(item.remaining)}
                      </td>
                      <td className={`px-5 py-3.5 text-right text-sm font-extrabold ${item.cumulativeSavings >= 0 ? 'text-brand-500' : 'text-rose-500'}`}>
                        {formatVND(item.cumulativeSavings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
};

export default MonthlyBalancePage;
