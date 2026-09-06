import { updateWalletSchema } from '../../validators/wallet.validator';

describe('wallet update validator', () => {
  it('rejects direct initial-balance changes', () => {
    const result = updateWalletSchema.safeParse({ body: { initialBalance: 1_000_000 } });
    expect(result.success).toBe(false);
  });
});
