import '../helpers/prisma-mock';
import { TransactionService } from '../../services/transaction.service';
import { ExportService } from '../../services/export.service';

jest.mock('../../services/transaction.service');

const MockTransactionService = TransactionService as jest.MockedClass<typeof TransactionService>;

describe('ExportService', () => {
  it('paginates until every monthly transaction is included in the Excel export', async () => {
    const service = new ExportService();
    const mockedService = MockTransactionService.mock.instances.at(-1) as jest.Mocked<TransactionService>;
    mockedService.getMonthlyReport.mockResolvedValue({
      month: 9,
      year: 2026,
      summary: { totalIncome: 0, totalExpense: 501, netSavings: -501 } as any,
      categoryExpenses: [],
    });
    const transaction = {
      id: 'tx',
      transactionDate: new Date('2026-09-01T00:00:00.000Z'),
      type: 'EXPENSE',
      amount: 1,
      note: '',
      category: { name: 'Khác' },
      wallet: { name: 'Ví' },
    };
    mockedService.getTransactions
      .mockResolvedValueOnce({
        transactions: Array.from({ length: 500 }, (_, index) => ({ ...transaction, id: `tx-${index}` })) as any,
        pagination: { total: 501, skip: 0, take: 500 },
      })
      .mockResolvedValueOnce({
        transactions: [{ ...transaction, id: 'tx-500' }] as any,
        pagination: { total: 501, skip: 500, take: 500 },
      });

    const buffer = await service.generateMonthlyExcel('user-1', 9, 2026);

    expect(buffer.length).toBeGreaterThan(0);
    expect(mockedService.getTransactions).toHaveBeenCalledTimes(2);
    expect(mockedService.getTransactions).toHaveBeenNthCalledWith(2, 'user-1', expect.objectContaining({
      skip: 500,
      take: 500,
    }));
  });
});
