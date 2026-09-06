import { TransactionType } from '@prisma/client';
import {
  createTransactionSchema,
  monthlyReportQuerySchema,
  monthlyTrendQuerySchema,
  transactionListSchema,
  updateTransactionSchema,
  yearlyReportQuerySchema,
} from '../../validators/transaction.validator';

const validBody = {
  walletId: '11111111-1111-4111-8111-111111111111',
  categoryId: '22222222-2222-4222-8222-222222222222',
  amount: 100_000,
  type: TransactionType.EXPENSE,
  transactionDate: new Date(),
};

describe('transaction validators', () => {
  it('rejects TRANSFER on the generic create endpoint', () => {
    expect(createTransactionSchema.safeParse({ body: { ...validBody, type: TransactionType.TRANSFER } }).success)
      .toBe(false);
  });

  it('rejects future dates on create and update', () => {
    const future = new Date(Date.now() + 60_000);
    expect(createTransactionSchema.safeParse({ body: { ...validBody, transactionDate: future } }).success)
      .toBe(false);
    expect(updateTransactionSchema.safeParse({ body: { transactionDate: future } }).success)
      .toBe(false);
  });

  it('coerces and bounds transaction list pagination and sort fields', () => {
    const parsed = transactionListSchema.parse({ query: { skip: '20', take: '50', order: 'asc' } });
    expect(parsed.query).toMatchObject({
      skip: 20,
      take: 50,
      sortBy: 'transactionDate',
      order: 'asc',
    });
    expect(transactionListSchema.safeParse({ query: { take: '201' } }).success).toBe(false);
    expect(transactionListSchema.safeParse({ query: { sortBy: 'userId' } }).success).toBe(false);
    expect(transactionListSchema.safeParse({ query: { type: 'NOT_A_TYPE' } }).success).toBe(false);
  });

  it('rejects invalid calendar dates and reversed ranges', () => {
    expect(transactionListSchema.safeParse({ query: { startDate: '2026-02-30' } }).success).toBe(false);
    expect(transactionListSchema.safeParse({
      query: { startDate: '2026-09-02', endDate: '2026-09-01' },
    }).success).toBe(false);
  });

  it('validates monthly, yearly, and trend report bounds', () => {
    expect(monthlyReportQuerySchema.safeParse({ query: { month: '13', year: '2026' } }).success).toBe(false);
    expect(yearlyReportQuerySchema.safeParse({ query: { year: '1969' } }).success).toBe(false);
    expect(monthlyTrendQuerySchema.safeParse({ query: { months: '24' } }).success).toBe(false);
    expect(monthlyReportQuerySchema.parse({ query: { month: '9', year: '2026' } }).query)
      .toEqual({ month: 9, year: 2026 });
  });
});
