import { updateWalletSchema } from '../../validators/wallet.validator';

describe('wallet update validator', () => {
  it('accepts a nonnegative initial-balance change', () => {
    const result = updateWalletSchema.safeParse({ body: { initialBalance: 1_000_000 } });
    expect(result.success).toBe(true);
  });

  it('rejects a negative initial-balance change', () => {
    const result = updateWalletSchema.safeParse({ body: { initialBalance: -1 } });
    expect(result.success).toBe(false);
  });
});
