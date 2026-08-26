import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, LabelList,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Sparkles, Loader2, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Utensils, Home, Car, Shapes } from 'lucide-react';
import api from '@/services/api/client';
import { formatChartValue, formatVND } from '@/utils/formatCurrency';
import SummaryCard from '@/components/common/SummaryCard/SummaryCard';

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

const CATEGORY_COLORS = ['#1473e6', '#6947d8', '#0891b2', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#8b5cf6'];

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Báo cáo tài chính</h1>
          <p className="mt-1 max-w-sm text-slate-500 dark:text-slate-400">Phân tích chuyên sâu thu chi và xu hướng tài sản</p>
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['monthly', 'yearly'] as const).map((t) => (
              <AppButton unstyled key={t} onClick={() => setReportType(t)} className={`min-w-20 rounded-lg px-4 py-2 font-semibold transition ${reportType === t ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                {t === 'monthly' ? 'Theo tháng' : 'Theo năm'}
              </AppButton>
            ))}
          </div>
          {reportType === 'monthly' && (
            <>
              <AppButton unstyled onClick={() => handleExport('pdf')} disabled={!!exporting}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                <span>Xuất<br />PDF</span>
              </AppButton>
              <AppButton unstyled onClick={() => handleExport('excel')} disabled={!!exporting}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {exporting === 'excel' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                <span>Xuất<br />Excel</span>
              </AppButton>
            </>
          )}
        </div>
      </div>

      {/* Period Navigator */}
      <div className="flex items-center justify-center gap-3">
        <AppButton unstyled aria-label="Kỳ trước" onClick={prevPeriod} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <ChevronLeft size={18} />
        </AppButton>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 font-bold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <Calendar size={17} className="text-blue-600" />
          {reportType === 'monthly' ? `${MONTHS[month - 1]}, ${year}` : `Năm ${year}`}
        </div>
        <AppButton unstyled aria-label="Kỳ sau" onClick={nextPeriod} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <ChevronRight size={18} />
        </AppButton>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard icon={<TrendingUp size={18} />} label="Tổng thu nhập" value={formatVND(summary?.totalIncome || 0)} tone="green" />
            <SummaryCard icon={<TrendingDown size={18} />} label="Tổng chi tiêu" value={formatVND(summary?.totalExpense || 0)} tone="red" />
            <SummaryCard icon={<Sparkles size={18} />} label="Tiết kiệm" badge={`${savingsRate}%`} value={formatVND(summary?.netSavings || 0)} tone={(summary?.netSavings || 0) >= 0 ? 'blue' : 'red'} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            {/* Bar/Line Chart */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:bg-slate-900">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-extrabold text-slate-950 dark:text-slate-100">
                {reportType === 'yearly' ? 'Thu chi theo tháng' : 'Thu chi tháng này'}
              </h2><div className="flex gap-4 font-semibold"><span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><i className="h-3 w-3 rounded-full bg-emerald-500" />Thu nhập</span><span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><i className="h-3 w-3 rounded-full bg-red-600" />Chi tiêu</span></div></div>
              <ResponsiveContainer width="100%" height={300}>
                {reportType === 'yearly' ? (
                  <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatChartValue} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                      formatter={(value: any) => formatVND(value)}
                    />
                    <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 24, right: 10, left: -10, bottom: 0 }} barGap={16}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatChartValue} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                      formatter={(value: any) => formatVND(value)}
                    />
                    <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={72}><LabelList dataKey="income" position="top" formatter={(v: unknown) => formatVND(Number(v))} fill="#059669" /></Bar>
                    <Bar dataKey="expense" name="Chi tiêu" fill="#c91d24" radius={[8, 8, 0, 0]} maxBarSize={72}><LabelList dataKey="expense" position="top" formatter={(v: unknown) => formatVND(Number(v))} fill="#c91d24" /></Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:bg-slate-900">
              <h2 className="mb-5 font-extrabold text-slate-950 dark:text-slate-100">Cơ cấu chi tiêu</h2>
              {categoryExpenses.length > 0 ? (
                  <ul className="space-y-5">
                    {categoryExpenses.slice(0, 8).map((cat: any, i: number) => {
                      const total = categoryExpenses.reduce((s: number, c: any) => s + c.amount, 0);
                      const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
                      const Icon = i === 0 ? Utensils : i === 1 ? Home : i === 2 ? Car : Shapes;
                      const color = cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                      return (
                        <li key={cat.id}>
                          <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800" style={{ color }}><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-slate-900 dark:text-white">{cat.name}</p><p className="text-slate-500 dark:text-slate-400">{pct}% tổng chi</p></div><strong className="whitespace-nowrap text-slate-950 dark:text-white">{formatVND(cat.amount)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} /></div></div></div>
                        </li>
                      );
                    })}
                  </ul>
              ) : (
                <div className="flex h-48 items-center justify-center text-slate-500">
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
