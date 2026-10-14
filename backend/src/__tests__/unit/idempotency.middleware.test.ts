import mockPrisma from '../helpers/prisma-mock';
import { idempotency } from '../../middlewares/idempotency';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

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

  it('retains a server-error response so an ambiguous commit cannot be repeated', async () => {
    mockPrisma.idempotencyRecord.create.mockResolvedValue({ id: 'record-id' });
    mockPrisma.idempotencyRecord.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.idempotencyRecord.deleteMany.mockResolvedValue({ count: 1 });
    const originalJson = jest.fn();
    const response = { statusCode: 500, json: originalJson, locals: { requestId: 'request-1' } };
    const request = {
      header: (name: string) => name === 'Idempotency-Key' ? 'request-id' : undefined,
      user: { id: 'user-id' },
      method: 'POST',
      baseUrl: '/api/transactions',
      path: '/',
      body: { amount: 1000 },
    };
    const next = jest.fn();

    await idempotency(request as never, response as never, next);
    response.json({ code: 'INTERNAL_ERROR', message: 'Unexpected failure' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockPrisma.idempotencyRecord.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED', statusCode: 500 }),
    }));
    expect(mockPrisma.idempotencyRecord.deleteMany).not.toHaveBeenCalled();
    expect(originalJson).toHaveBeenCalled();
  });

  it('replays a retained server error without invoking the mutation again', async () => {
    const requestBody = { amount: 1000 };
    const requestHash = createHash('sha256')
      .update(JSON.stringify({
        method: 'POST',
        path: '/api/transactions/',
        body: requestBody,
      }))
      .digest('hex');
    mockPrisma.idempotencyRecord.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate key', {
        code: 'P2002',
        clientVersion: '5.12.1',
      }),
    );
    mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
      id: 'record-id',
      userId: 'user-id',
      key: 'request-id',
      requestHash,
      status: 'COMPLETED',
      statusCode: 500,
      responseBody: { code: 'INTERNAL_ERROR', message: 'Unexpected failure' },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    const request = {
      header: (name: string) => name === 'Idempotency-Key' ? 'request-id' : undefined,
      user: { id: 'user-id' },
      method: 'POST',
      baseUrl: '/api/transactions',
      path: '/',
      body: requestBody,
    };
    const next = jest.fn();

    await idempotency(request as never, response as never, next);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ code: 'INTERNAL_ERROR', message: 'Unexpected failure' });
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['PUT', 'DELETE'])('replays a confirmed %s without repeating the mutation', async method => {
    const request = {
      header: () => 'copilot-operation', user: { id: 'owner-user' }, method,
      baseUrl: '/api/transactions', path: '/tx-1',
      body: method === 'PUT' ? { amount: 150000, version: 3 } : undefined,
      query: method === 'DELETE' ? { version: 3 } : {},
    };
    const requestHash = createHash('sha256').update(JSON.stringify({
      method, path: '/api/transactions/tx-1', body: request.body,
      ...(method === 'DELETE' ? { query: request.query } : {}),
    })).digest('hex');
    mockPrisma.idempotencyRecord.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5.12.1' }));
    const body = { success: true, data: method === 'PUT' ? { id: 'tx-1', version: 4 } : null };
    mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
      key: 'copilot-operation', userId: 'owner-user', requestHash, status: 'COMPLETED', statusCode: 200,
      responseBody: body, expiresAt: new Date(Date.now() + 60000),
    });
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    const next = jest.fn();
    await idempotency(request as never, response as never, next);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
    if (method === 'DELETE') {
      await idempotency({ ...request, query: { version: 4 } } as never, response as never, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    }
  });
});
