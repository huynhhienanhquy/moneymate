import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Sparkles, Loader2, TrendingUp, Target, AlertTriangle, ChevronRight,
  Brain, ScanLine, MessageCircle,
} from 'lucide-react';
import api from '../services/api';
import AiInsightCard from '../components/AiInsightCard';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

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
  const scoreColor = healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={22} className="text-brand-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">AI Tài chính</h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Phân tích thông minh, dự đoán ngân sách & cố vấn cá nhân
            {status && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400">
                {status.enhancedWithLlm ? `OpenAI ${status.model}` : 'Rule-based'}
              </span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
      ) : (
        <>
          {/* Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
              <Brain size={28} className="text-brand-400 mb-3" />
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Điểm sức khỏe tài chính</p>
              <p className={`text-5xl font-extrabold ${scoreColor}`}>{healthScore}</p>
              <p className="text-xs text-slate-500 mt-1">/ 100</p>
            </div>
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-200 mb-3">Tóm tắt AI</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                {advisor?.aiAdvice || analysis?.aiSummary || 'Đang phân tích dữ liệu...'}
              </p>
              {analysis?.summary && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Thu nhập</p>
                    <p className="text-sm font-bold text-emerald-400">{formatVND(analysis.summary.monthlyIncome)}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Chi tiêu</p>
                    <p className="text-sm font-bold text-rose-400">{formatVND(analysis.summary.monthlyExpense)}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Tiết kiệm</p>
                    <p className="text-sm font-bold text-brand-400">{analysis.summary.savingsRate}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          {analysis?.insights?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-400" /> Phân tích chi tiêu
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
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-200 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> Dự đoán ngân sách
              </h2>
              <p className="text-sm text-slate-500 mb-3">{forecast.summary}</p>
              <div className="space-y-2">
                {forecast.forecasts.filter((f: any) => f.severity !== 'OK').map((f: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border text-sm ${
                    f.severity === 'CRITICAL' ? 'border-rose-500/20 bg-rose-500/5 text-rose-300' : 'border-amber-500/20 bg-amber-500/5 text-amber-300'
                  }`}>
                    {f.message}
                  </div>
                ))}
                {forecast.forecasts.every((f: any) => f.severity === 'OK') && (
                  <p className="text-sm text-emerald-400">✓ Tất cả ngân sách đang được kiểm soát tốt.</p>
                )}
              </div>
              <Link to="/budgets" className="inline-flex items-center gap-1 text-sm text-brand-400 mt-3 hover:text-brand-300">
                Xem ngân sách <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* Recommendations */}
          {advisor?.recommendations?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Target size={18} className="text-brand-400" /> Lời khuyên tài chính
              </h2>
              <div className="space-y-3">
                {advisor.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-rose-500/10 text-rose-400' :
                        rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>{rec.priority}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">{rec.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                        <p className="text-xs text-brand-400 mt-1.5">→ {rec.action}</p>
                        {rec.potentialSaving > 0 && (
                          <p className="text-xs text-emerald-400 mt-1">Tiết kiệm tiềm năng: {formatVND(rec.potentialSaving)}/tháng</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/transactions" className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl hover:border-brand-500/30 transition">
              <ScanLine size={24} className="text-brand-400" />
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-slate-200">Quét hóa đơn OCR</p>
                <p className="text-xs text-slate-500">Tự động điền giao dịch từ ảnh/PDF</p>
              </div>
              <ChevronRight size={16} className="ml-auto text-slate-500" />
            </Link>
            <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
              <MessageCircle size={24} className="text-brand-400" />
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-slate-200">Chatbot tài chính</p>
                <p className="text-xs text-slate-500">Nút chat góc phải màn hình</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AiAdvisorPage;
