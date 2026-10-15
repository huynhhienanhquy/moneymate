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
  blue: { icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300', value: 'text-blue-700 dark:text-blue-300', soft: 'border-ui-border bg-ui-surface', solid: 'border-blue-700/20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900' },
  green: { icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', value: 'text-emerald-600 dark:text-emerald-400', soft: 'border-ui-border bg-ui-surface', solid: 'border-emerald-700/20 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800' },
  red: { icon: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', value: 'text-rose-600 dark:text-rose-400', soft: 'border-ui-border bg-ui-surface', solid: 'border-rose-700/20 bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800' },
  cyan: { icon: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400', value: 'text-teal-600 dark:text-teal-400', soft: 'border-ui-border bg-ui-surface', solid: 'border-teal-700/20 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-800' },
  violet: { icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300', value: 'text-violet-600 dark:text-violet-400', soft: 'border-ui-border bg-ui-surface', solid: 'border-violet-700/20 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-800' },
};

/**
 * Render the summary card interface.
 *
 * Use it to keep the summary card workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered summary card interface.
 */
const SummaryCard = ({ icon, label, value, tone = 'blue', badge, caption, variant = 'soft', iconPosition = 'left', className = '' }: SummaryCardProps) => {
  const palette = tones[tone];
  const isSolid = variant === 'solid';
  return (
    <AppCard padding="none" className={`relative min-w-0 overflow-hidden rounded-2xl border p-5 shadow-summary ${isSolid ? `min-h-[164px] ${palette.solid}` : `min-h-[128px] ${palette.soft}`} ${className}`}>
      <div className={`relative flex items-center gap-3 ${iconPosition === 'right' ? 'justify-between' : ''}`}>
        {iconPosition === 'left' && <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isSolid ? 'border border-white/20 bg-white/15 text-white' : palette.icon}`}>{icon}</span>}
        <p className={`text-xs font-medium ${isSolid ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
        {badge && <span className={`ml-auto rounded-full px-2.5 py-1 font-bold ${isSolid ? 'border border-white/20 bg-white/15 text-white' : palette.icon}`}>{badge}</span>}
        {iconPosition === 'right' && <span className={`ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isSolid ? 'border border-white/20 bg-white/15 text-white' : palette.icon}`}>{icon}</span>}
      </div>
      <p className={`relative mt-4 break-words font-extrabold leading-tight tracking-tight tabular-nums ${isSolid ? 'text-3xl text-white' : `text-[26px] ${palette.value}`}`}>{value}</p>
      {caption && <p className={`relative mt-2 text-xs leading-5 ${isSolid ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>{caption}</p>}
    </AppCard>
  );
};

export default SummaryCard;
