import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Sparkles, Loader2, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';

const downloadFile = async (url: string, filename: string) => {
  const [path, query] = url.split('?');
  const params = Object.fromEntries(new URLSearchParams(query || ''));
  const res = await api.get(path, { params, responseType: 'blob' });
  const blob = new Blob([res.data]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['#2a95ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6'];

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const ReportsPage: React.FC = () => {
  const now = new Date();
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const handleExport = async (type: 'pdf' | 'excel') => {
    setExporting(type);
    try {
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      await downloadFile(
        `/attachments/export/${type}?month=${month}&year=${year}`,
        `baocao-T${month}-${year}.${ext}`
      );
    } finally {
      setExporting(null);
    }
  };

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-report', month, year],
    queryFn: () => api.get('/transactions/report', { params: { month, year } }).then(r => r.data.data),
    enabled: reportType === 'monthly',
    staleTime: 60_000,
  });

  const { data: yearlyReport, isLoading: yearlyLoading } = useQuery({
    queryKey: ['yearly-report', year],
    queryFn: () => api.get('/transactions/report/yearly', { params: { year } }).then(r => r.data.data),
    enabled: reportType === 'yearly',
    staleTime: 60_000,
  });

  const isLoading = reportType === 'monthly' ? monthlyLoading : yearlyLoading;

  const prevPeriod = () => {
    if (reportType === 'monthly') {
      if (month === 1) { setMonth(12); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      setYear(y => y - 1);
    }
  };

  const nextPeriod = () => {
    if (reportType === 'monthly') {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    } else {
      setYear(y => y + 1);
    }
  };

  const summary = reportType === 'monthly'
    ? monthlyReport?.summary
    : { totalIncome: yearlyReport?.totalIncome, totalExpense: yearlyReport?.totalExpense, netSavings: yearlyReport?.netSavings };

  const categoryExpenses = reportType === 'monthly'
    ? monthlyReport?.categoryExpenses || []
    : yearlyReport?.categoryExpenses || [];

  const chartData = reportType === 'yearly'
    ? (yearlyReport?.monthlyData || [])
    : [{ name: MONTHS[month - 1], income: summary?.totalIncome || 0, expense: summary?.totalExpense || 0 }];

  const savingsRate = summary?.totalIncome > 0
    ? Math.round((summary.netSavings / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Báo cáo tài chính</h1>
          <p className="text-slate-400 text-sm mt-0.5">Phân tích thu chi theo tháng và năm</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {reportType === 'monthly' && (
            <>
              <button onClick={() => handleExport('pdf')} disabled={!!exporting}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-60">
                {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                PDF
              </button>
              <button onClick={() => handleExport('excel')} disabled={!!exporting}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-60">
                {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                Excel
              </button>
            </>
          )}
          <div className="flex gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1">
            {(['monthly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${reportType === t
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t === 'monthly' ? 'Theo tháng' : 'Theo năm'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period Navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevPeriod} className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Calendar size={18} className="text-brand-400" />
          {reportType === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `Năm ${year}`}
        </div>
        <button onClick={nextPeriod} className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition">
          <ChevronRight size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng thu nhập</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{formatVND(summary?.totalIncome || 0)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                  <TrendingDown size={18} className="text-rose-400" />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng chi tiêu</p>
              </div>
              <p className="text-2xl font-bold text-rose-400">{formatVND(summary?.totalExpense || 0)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Sparkles size={18} className="text-amber-400" />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiết kiệm ({savingsRate}%)</p>
              </div>
              <p className={`text-2xl font-bold ${(summary?.netSavings || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatVND(summary?.netSavings || 0)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar/Line Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-slate-200 mb-5">
                {reportType === 'yearly' ? 'Thu chi theo tháng' : 'Thu chi tháng này'}
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                {reportType === 'yearly' ? (
                  <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                      formatter={(value: any) => formatVND(value)}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                )}
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-slate-200 mb-5">Top chi tiêu theo danh mục</h2>
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
                        {categoryExpenses.map((entry: any, index: number) => (
                          <Cell key={entry.id} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatVND(value)}
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-2">
                    {categoryExpenses.slice(0, 8).map((cat: any, i: number) => {
                      const total = categoryExpenses.reduce((s: number, c: any) => s + c.amount, 0);
                      const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
                      return (
                        <li key={cat.id} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-slate-400">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: cat.color || PIE_COLORS[i % PIE_COLORS.length] }}></span>
                            {cat.name}
                          </span>
                          <span className="font-semibold text-slate-200">{formatVND(cat.amount)} ({pct}%)</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                  Chưa có dữ liệu chi tiêu
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
