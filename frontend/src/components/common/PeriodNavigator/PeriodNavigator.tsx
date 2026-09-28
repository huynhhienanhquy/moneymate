import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

type PeriodNavigatorProps = {
  label: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
};

/** Shared month/year control used by transactions, budgets, reports and savings. */
const PeriodNavigator = ({
  label,
  onPrevious,
  onNext,
  previousLabel = 'Kỳ trước',
  nextLabel = 'Kỳ sau',
  className = '',
}: PeriodNavigatorProps) => (
  <div className={`inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}>
    <button type="button" aria-label={previousLabel} onClick={onPrevious} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800">
      <ChevronLeft className="size-4" />
    </button>
    <div className="flex min-w-36 items-center justify-center gap-2 px-3 text-sm font-bold text-slate-800 dark:text-slate-100">
      <CalendarDays className="size-4 text-blue-600" />
      {label}
    </div>
    <button type="button" aria-label={nextLabel} onClick={onNext} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800">
      <ChevronRight className="size-4" />
    </button>
  </div>
);

export default PeriodNavigator;
