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
import { Calendar, ChevronLeft, ChevronRight, Loader2, TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import api from '@/shared/api/client';

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const MonthlyBalancePage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['monthly-balance', year],
    queryFn: () => api.get('/transactions/report/yearly', { params: { year } }).then((r) => r.data.data),
    staleTime: 60_000,
  });

  const walletBalanceTotal = Number(data?.walletBalanceTotal || 0);
  const accountCreatedAt = data?.accountCreatedAt ? new Date(data.accountCreatedAt) : null;
  const now = new Date();
  const currentMonthBoundary = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyData = (data?.monthlyData || [])
    .filter((item: any) => {
      const itemDate = new Date(year, item.month - 1, 1);
      if (itemDate > currentMonthBoundary) return false;
      if (!accountCreatedAt) return true;
      const createdMonth = new Date(accountCreatedAt.getFullYear(), accountCreatedAt.getMonth(), 1);
      return itemDate >= createdMonth;
    })
    .map((item: any) => ({
      month: item.month,
      label: item.label || MONTHS[item.month - 1],
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
      remaining: walletBalanceTotal + Number(item.income || 0) - Number(item.expense || 0),
    }));

  const totalIncome = monthlyData.reduce((sum: number, item: any) => sum + item.income, 0);
  const totalExpense = monthlyData.reduce((sum: number, item: any) => sum + item.expense, 0);
  const averageAssets = monthlyData.length
    ? monthlyData.reduce((sum: number, item: any) => sum + item.remaining, 0) / monthlyData.length
    : 0;
  const bestMonth = monthlyData.reduce((best: any, item: any) => (!best || item.remaining > best.remaining ? item : best), null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Tiết kiệm mỗi tháng</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tính từ tháng tạo tài khoản đến tháng hiện tại. Các tháng chưa tới sẽ không thống kê.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="app-card flex items-center gap-2 px-4 py-2 font-semibold text-slate-900 dark:text-slate-200">
            <Calendar size={18} className="text-brand-500" />
            Năm {year}
          </div>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {monthlyData.length === 0 ? (
            <div className="app-card flex flex-col items-center justify-center py-20 text-center">
              <WalletCards size={42} className="mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">Chưa có dữ liệu trong năm {year}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tài khoản được tạo từ {accountCreatedAt?.toLocaleDateString('vi-VN') || 'ngày đăng ký'}, nên các tháng trước đó không được tính.
              </p>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="app-card app-card-hover p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <TrendingUp size={18} className="text-emerald-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng thu nhập</p>
              </div>
              <p className="text-2xl font-extrabold text-emerald-500">{formatVND(totalIncome)}</p>
            </div>

            <div className="app-card app-card-hover p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10">
                  <TrendingDown size={18} className="text-rose-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng chi tiêu</p>
              </div>
              <p className="text-2xl font-extrabold text-rose-500">{formatVND(totalExpense)}</p>
            </div>

            <div className="app-card app-card-hover p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10">
                  <WalletCards size={18} className="text-brand-500" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tài sản trung bình</p>
              </div>
              <p className={`text-2xl font-extrabold ${averageAssets >= 0 ? 'text-brand-500' : 'text-rose-500'}`}>
                {formatVND(averageAssets)}
              </p>
              {bestMonth && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tháng tốt nhất: {bestMonth.label}</p>}
            </div>
          </div>

          <div className="app-card p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Tiết kiệm theo tháng</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Công thức: tổng tài sản + thu nhập - chi tiêu.</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(value: any) => formatVND(Number(value))}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }}
                />
                <Bar dataKey="remaining" name="Tiết kiệm tháng" radius={[8, 8, 0, 0]}>
                  {monthlyData.map((item: any) => (
                    <Cell key={item.month} fill={item.remaining >= 0 ? '#1475ff' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="app-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Chi tiết từng tháng</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Tháng</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Thu nhập</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Chi tiêu</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Tiết kiệm tháng</th>
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
