import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const ICON_MAP = {
  increase: TrendingUp,
  decrease: TrendingDown,
  warning: AlertTriangle,
  positive: CheckCircle2,
  info: Info,
};

const COLOR_MAP = {
  increase: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
  decrease: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  positive: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  info: 'border-brand-500/20 bg-brand-500/5 text-brand-400',
};

export const AiInsightCard: React.FC<{
  type: keyof typeof ICON_MAP;
  title: string;
  message: string;
}> = ({ type, title, message }) => {
  const Icon = ICON_MAP[type] || Info;
  const colors = COLOR_MAP[type] || COLOR_MAP.info;
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${colors}`}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs mt-0.5 opacity-80">{message}</p>
      </div>
    </div>
  );
};

export default AiInsightCard;
