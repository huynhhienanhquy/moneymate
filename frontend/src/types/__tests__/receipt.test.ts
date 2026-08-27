import type { ScanResult } from '@/types/receipt';

describe('ScanResult', () => {
  it('describes complete and partial receipt scan responses', () => {
    const result = {
      amount: null,
      transactionDate: null,
      merchant: null,
      note: null,
      suggestedCategoryId: null,
      suggestedCategoryName: null,
      confidence: 'low',
      poweredBy: 'test',
    } satisfies ScanResult;

    expect(result).toMatchObject({ amount: null, confidence: 'low', poweredBy: 'test' });
  });
});
