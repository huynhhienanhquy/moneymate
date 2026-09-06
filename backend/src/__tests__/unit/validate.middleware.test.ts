import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { createTransactionSchema, transactionSyncSchema } from '../../validators/transaction.validator';
import { validateRequest } from '../../middlewares/validate';

describe('validateRequest parsed values', () => {
  it('delivers an HTTP transaction date to the handler as a Date', async () => {
    const app = express();
    app.use(express.json());
    app.post('/transactions', validateRequest(createTransactionSchema), (req, res) => {
      res.json({ isDate: req.body.transactionDate instanceof Date });
    });

    const response = await request(app).post('/transactions').send({
      walletId: '11111111-1111-4111-8111-111111111111',
      categoryId: '22222222-2222-4222-8222-222222222222',
      amount: 100,
      type: 'EXPENSE',
      transactionDate: '2026-01-01T00:00:00.000Z',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ isDate: true });
  });

  it('writes coerced body values back to the request', async () => {
    const request = {
      body: {
        walletId: '11111111-1111-4111-8111-111111111111',
        categoryId: '22222222-2222-4222-8222-222222222222',
        amount: 100,
        type: 'EXPENSE',
        transactionDate: '2026-01-01T00:00:00.000Z',
      },
      query: {},
      params: {},
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await validateRequest(createTransactionSchema)(request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(request.body.transactionDate).toBeInstanceOf(Date);
  });

  it('writes defaulted and coerced query values back to the request', async () => {
    const request = {
      body: {},
      query: { take: '25' },
      params: {},
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    await validateRequest(transactionSyncSchema)(request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(request.query.take).toBe(25);
  });
});
