import mockPrisma from '../helpers/prisma-mock';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { Prisma } from '@prisma/client';

jest.mock('../../services/transaction.service', () => ({
  TransactionService: jest.fn().mockImplementation(() => ({
    updateTransaction: jest.fn(), deleteTransaction: jest.fn(),
  })),
}));

import transactionRoutes from '../../routes/transaction.routes';
import { TransactionService } from '../../services/transaction.service';
import { errorHandler } from '../../middlewares/error';

const service = (TransactionService as unknown as jest.Mock).mock.results[0].value;
const transactionId = '11111111-1111-4111-8111-111111111111';
const originalSecret = process.env.JWT_ACCESS_SECRET;
const secret = 'transaction-route-test-secret-at-least-32-characters';
const token = () => jwt.sign({ userId: 'owner-user', email: 'owner@example.invalid', role: 'USER' }, secret, { algorithm: 'HS256' });
const app = express();
app.use(express.json());
app.use('/api/transactions', transactionRoutes);
app.use(errorHandler);

describe('confirmed transaction mutation API contract', () => {
  beforeAll(() => { process.env.JWT_ACCESS_SECRET = secret; });
  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalSecret;
  });
  beforeEach(() => {
    service.updateTransaction.mockReset().mockResolvedValue({ id: transactionId, version: 4 });
    service.deleteTransaction.mockReset().mockResolvedValue(undefined);
    mockPrisma.idempotencyRecord.create.mockReset().mockResolvedValue({ id: 'request-record' });
    mockPrisma.idempotencyRecord.updateMany.mockResolvedValue({ count: 1 });
  });

  it('passes only the requested update fields and reviewed version under the authenticated principal', async () => {
    const response = await request(app).put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token()}`).set('Idempotency-Key', 'copilot-update-call-0')
      .send({ amount: 150000, note: '', version: 3 });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: transactionId, version: 4 });
    expect(service.updateTransaction).toHaveBeenCalledWith('owner-user', transactionId, { amount: 150000, note: '', version: 3 });
    expect(mockPrisma.idempotencyRecord.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'owner-user', key: 'copilot-update-call-0' }) }));
  });

  it('replays a confirmed delete with the same key, preserving its version and null response', async () => {
    const deleteRequest = (version = 3) => request(app).delete(`/api/transactions/${transactionId}?version=${version}`)
      .set('Authorization', `Bearer ${token()}`).set('Idempotency-Key', 'copilot-delete-call-0');
    const first = await deleteRequest();
    expect(first.status).toBe(200);
    expect(first.body.data).toBeNull();
    expect(service.deleteTransaction).toHaveBeenCalledWith('owner-user', transactionId, 3);
    const record = mockPrisma.idempotencyRecord.create.mock.calls[0][0].data;
    mockPrisma.idempotencyRecord.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5.12.1' }));
    mockPrisma.idempotencyRecord.findUnique.mockResolvedValue({
      ...record, status: 'COMPLETED', statusCode: 200, responseBody: first.body,
    });
    const replay = await deleteRequest();
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(first.body);
    expect(service.deleteTransaction).toHaveBeenCalledTimes(1);
    expect((await deleteRequest(4)).status).toBe(409);
    expect(service.deleteTransaction).toHaveBeenCalledTimes(1);
  });

  it.each(['put', 'delete'] as const)('rejects unauthenticated %s before writing or claiming a request key', async method => {
    const response = await request(app)[method](`/api/transactions/${transactionId}`)
      .set('Idempotency-Key', 'unauthorized-request').send(method === 'put' ? { amount: 150000, version: 3 } : {});
    expect(response.status).toBe(401);
    expect(mockPrisma.idempotencyRecord.create).not.toHaveBeenCalled();
    expect(service.updateTransaction).not.toHaveBeenCalled();
    expect(service.deleteTransaction).not.toHaveBeenCalled();
  });
});
