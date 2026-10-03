import React from 'react';
import AppCard from '@/components/common/AppCard/AppCard';

type SummaryTone = 'blue' | 'green' | 'red' | 'cyan' | 'violet';

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: SummaryTone;
  badge?: string;
  caption?: string;
  variant?: 'soft' | 'solid';
  iconPosition?: 'left' | 'right';
  className?: string;
}

const tones: Record<SummaryTone, { icon: string; value: string; soft: string; solid: string }> = {
  blue: { icon: 'bg-blue-600 text-white', value: 'text-blue-700 dark:text-blue-300', soft: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/90 dark:border-blue-500/20 dark:from-slate-900 dark:to-blue-950/30', solid: 'border-blue-700/20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900' },
  green: { icon: 'bg-emerald-600 text-white', value: 'text-emerald-600', soft: 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/90 dark:border-emerald-500/20 dark:from-slate-900 dark:to-emerald-950/30', solid: 'border-emerald-700/20 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800' },
  red: { icon: 'bg-rose-600 text-white', value: 'text-rose-600', soft: 'border-rose-100 bg-gradient-to-br from-white to-rose-50/90 dark:border-rose-500/20 dark:from-slate-900 dark:to-rose-950/30', solid: 'border-rose-700/20 bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800' },
  cyan: { icon: 'bg-teal-600 text-white', value: 'text-teal-600', soft: 'border-teal-100 bg-gradient-to-br from-white to-teal-50/90 dark:border-teal-500/20 dark:from-slate-900 dark:to-teal-950/30', solid: 'border-teal-700/20 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-800' },
  violet: { icon: 'bg-violet-600 text-white', value: 'text-violet-600', soft: 'border-violet-100 bg-gradient-to-br from-white to-violet-50/90 dark:border-violet-500/20 dark:from-slate-900 dark:to-violet-950/30', solid: 'border-violet-700/20 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800' },
};

const SummaryCard = ({ icon, label, value, tone = 'blue', badge, caption, variant = 'soft', iconPosition = 'left', className = '' }: SummaryCardProps) => {
  const palette = tones[tone];
  const isSolid = variant === 'solid';
  return (
    <AppCard padding="none" className={`relative overflow-hidden rounded-card border p-5 shadow-summary ${isSolid ? `min-h-[164px] ${palette.solid}` : `min-h-[128px] ${palette.soft}`} ${className}`}>
      <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full ${isSolid ? 'bg-white/10' : 'bg-surface-container/65 dark:bg-slate-800/50'}`} />
      <div className={`relative flex items-center gap-3 ${iconPosition === 'right' ? 'justify-between' : ''}`}>
        {iconPosition === 'left' && <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${isSolid ? 'border border-white/20 bg-white/15 text-white' : palette.icon}`}>{icon}</span>}
        <p className={`text-xs font-bold uppercase tracking-wide ${isSolid ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
        {badge && <span className={`ml-auto rounded-full px-2.5 py-1 font-bold ${isSolid ? 'border border-white/20 bg-white/15 text-white' : palette.icon}`}>{badge}</span>}
        {iconPosition === 'right' && <span className={`ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${isSolid ? 'border border-white/20 bg-white/15 text-white' : palette.icon}`}>{icon}</span>}
      </div>
      <p className={`relative mt-3 font-extrabold leading-none tracking-tight ${isSolid ? 'text-3xl text-white' : `text-[26px] ${palette.value}`}`}>{value}</p>
      {caption && <p className={`relative mt-2 text-xs leading-5 ${isSolid ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>{caption}</p>}
    </AppCard>
  );
};

export default SummaryCard;
