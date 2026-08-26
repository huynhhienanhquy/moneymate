import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Sparkles, Loader2, TrendingUp, Target, AlertTriangle, ChevronRight,
  Brain, ScanLine, MessageCircle,
} from 'lucide-react';
import api from '@/services/api/client';
import AiInsightCard from '@/components/AiInsightCard/AiInsightCard';
import { formatVND } from '@/utils/formatCurrency';

const AiAdvisorPage: React.FC = () => {
  const { data: advisor, isLoading: advisorLoading } = useQuery({
    queryKey: ['ai-advisor'],
    queryFn: () => api.get('/ai/advisor/insights').then(r => r.data.data),
    staleTime: 120_000,
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['ai-analysis'],
    queryFn: () => api.get('/ai/analyze/expenses').then(r => r.data.data),
    staleTime: 120_000,
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['ai-forecast'],
    queryFn: () => api.get('/ai/budget/forecast').then(r => r.data.data),
    staleTime: 120_000,
  });

  const { data: status } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get('/ai/status').then(r => r.data.data),
    staleTime: 300_000,
  });

  const isLoading = advisorLoading || analysisLoading || forecastLoading;
  const healthScore: number = advisor?.healthScore ?? 0;
  const scoreColor = healthScore >= 70 ? 'text-emerald-500' : healthScore >= 40 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="space-y-8">
      <div className="app-page-header">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={22} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-slate-950 dark:text-slate-100">AI Tài chính</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Phân tích thông minh, dự đoán ngân sách & cố vấn cá nhân
          {status && (
            <span className="ml-2 app-badge-info">
              {status.enhancedWithLlm ? `OpenAI ${status.model}` : 'Rule-based'}
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
      ) : (
        <>
          {/* Health Score + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="app-card col-span-1 p-6 flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 mb-3">
                <Brain size={24} className="text-brand-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Điểm sức khỏe tài chính</p>
              <p className={`text-5xl font-extrabold ${scoreColor}`}>{healthScore}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">/ 100</p>
              <div className="mt-4 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${
                  healthScore >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                  healthScore >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-rose-500 to-rose-400'
                }`} style={{ width: `${healthScore}%` }} />
              </div>
            </div>
            <div className="app-card lg:col-span-2 p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-500" /> Tóm tắt AI
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {advisor?.aiAdvice || analysis?.aiSummary || 'Đang phân tích dữ liệu...'}
              </p>
              {analysis?.summary && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thu nhập</p>
                    <p className="text-sm font-extrabold text-emerald-500">{formatVND(analysis.summary.monthlyIncome)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chi tiêu</p>
                    <p className="text-sm font-extrabold text-rose-500">{formatVND(analysis.summary.monthlyExpense)}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tiết kiệm</p>
                    <p className="text-sm font-extrabold text-brand-500">{analysis.summary.savingsRate}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          {analysis?.insights?.length > 0 && (
            <div className="animate-slide-up">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-500" /> Phân tích chi tiêu
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.insights.map((ins: any, i: number) => (
                  <AiInsightCard key={i} type={ins.type} title={ins.title} message={ins.message} />
                ))}
              </div>
            </div>
          )}

          {/* Budget Forecast */}
          {forecast?.forecasts?.length > 0 && (
            <div className="animate-slide-up">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Dự đoán ngân sách
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{forecast.summary}</p>
              <div className="space-y-2">
                {forecast.forecasts.filter((f: any) => f.severity !== 'OK').map((f: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border text-sm ${
                    f.severity === 'CRITICAL' ? 'border-rose-500/20 bg-rose-500/5 text-rose-500 dark:text-rose-400' : 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400'
                  }`}>
                    {f.message}
                  </div>
                ))}
                {forecast.forecasts.every((f: any) => f.severity === 'OK') && (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <TrendingUp size={16} /> Tất cả ngân sách đang được kiểm soát tốt.
                  </div>
                )}
              </div>
              <Link to="/budgets" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 mt-3 hover:text-brand-500 dark:hover:text-brand-300 font-semibold transition">
                Xem ngân sách <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* Recommendations */}
          {advisor?.recommendations?.length > 0 && (
            <div className="animate-slide-up">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Target size={18} className="text-brand-500" /> Lời khuyên tài chính
              </h2>
              <div className="space-y-3">
                {advisor.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="app-card p-4">
                    <div className="flex items-start gap-3">
                      <span className={`app-badge flex-shrink-0 ${
                        rec.priority === 'high' ? 'app-badge-danger' :
                        rec.priority === 'medium' ? 'app-badge-warning' :
                        'app-badge-neutral'
                      }`}>{rec.priority === 'high' ? 'Cao' : rec.priority === 'medium' ? 'TB' : 'Thấp'}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{rec.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">→ {rec.action}</p>
                          {rec.potentialSaving > 0 && (
                            <p className="text-xs font-semibold text-emerald-500">Tiết kiệm: {formatVND(rec.potentialSaving)}/th</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/transactions"
              className="app-card app-card-hover flex items-center gap-4 p-5 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 group-hover:bg-brand-500/20 transition">
                <ScanLine size={22} className="text-brand-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-slate-200">Quét hóa đơn OCR</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tự động điền giao dịch từ ảnh/PDF</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition" />
            </Link>
            <div className="app-card flex items-center gap-4 p-5 opacity-80">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10">
                <MessageCircle size={22} className="text-brand-500" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-200">Chatbot tài chính</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Nút chat góc phải màn hình</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AiAdvisorPage;
