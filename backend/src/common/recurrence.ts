import { Frequency } from '@prisma/client';

/** Advance a schedule while preserving its original day-of-month when possible. */
export function calculateNextDate(current: Date, frequency: Frequency, anchorDate: Date = current): Date {
  const next = new Date(current);

  switch (frequency) {
    case Frequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case Frequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case Frequency.MONTHLY: {
      const anchorDay = anchorDate.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(anchorDay, lastDay));
      break;
    }
    case Frequency.YEARLY: {
      const anchorMonth = anchorDate.getMonth();
      const anchorDay = anchorDate.getDate();
      next.setDate(1);
      next.setFullYear(next.getFullYear() + 1);
      next.setMonth(anchorMonth);
      const lastDay = new Date(next.getFullYear(), anchorMonth + 1, 0).getDate();
      next.setDate(Math.min(anchorDay, lastDay));
      break;
    }
  }

  return next;
}
