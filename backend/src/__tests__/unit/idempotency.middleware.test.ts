import mockPrisma from '../helpers/prisma-mock';
import { idempotency } from '../../middlewares/idempotency';

describe('idempotency middleware', () => {
  it('passes through requests without an idempotency key', async () => {
    const next = jest.fn();
    await idempotency({ header: () => undefined } as never, {} as never, next);
    expect(next).toHaveBeenCalledWith();
    expect(mockPrisma.idempotencyRecord.create).not.toHaveBeenCalled();
  });

  it('stores a successful response for replay', async () => {
    mockPrisma.idempotencyRecord.create.mockResolvedValue({ id: 'record-id' });
    mockPrisma.idempotencyRecord.updateMany.mockResolvedValue({ count: 1 });
    const originalJson = jest.fn();
    const response = { statusCode: 201, json: originalJson };
    const request = {
      header: (name: string) => name === 'Idempotency-Key' ? 'request-id' : undefined,
      user: { id: 'user-id' },
      method: 'POST',
      baseUrl: '/api/transactions',
      path: '/',
      body: { amount: 1000 }
    };
    const next = jest.fn();

    await idempotency(request as never, response as never, next);
    expect(next).toHaveBeenCalledWith();
    response.json({ success: true, data: { id: 'transaction-id' } });
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockPrisma.idempotencyRecord.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED', statusCode: 201 })
    }));
    expect(originalJson).toHaveBeenCalled();
  });
});
