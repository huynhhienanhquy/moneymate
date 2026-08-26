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
}

const tones: Record<SummaryTone, { icon: string; value: string }> = {
  blue: { icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15', value: 'text-slate-950 dark:text-white' },
  green: { icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15', value: 'text-emerald-600' },
  red: { icon: 'bg-rose-100 text-rose-500 dark:bg-rose-500/15', value: 'text-rose-600' },
  cyan: { icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15', value: 'text-cyan-600' },
  violet: { icon: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15', value: 'text-violet-600' },
};

const SummaryCard = ({ icon, label, value, tone = 'blue', badge, caption }: SummaryCardProps) => {
  const palette = tones[tone];
  return (
    <AppCard padding="none" className="relative overflow-hidden rounded-2xl p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-slate-50 dark:bg-slate-800/50" />
      <div className="relative flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${palette.icon}`}>{icon}</span>
        <p className="font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        {badge && <span className={`ml-auto rounded-md px-2 py-1 font-bold ${palette.icon}`}>{badge}</span>}
      </div>
      <p className={`relative mt-4 text-3xl font-extrabold ${palette.value}`}>{value}</p>
      {caption && <p className="relative mt-1 text-slate-500 dark:text-slate-400">{caption}</p>}
    </AppCard>
  );
};

export default SummaryCard;
