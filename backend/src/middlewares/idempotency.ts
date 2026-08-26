import { createHash } from 'crypto';
import { NextFunction, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { AppError } from '../common/app-error';
import { AuthenticatedRequest } from './auth';

export async function idempotency(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const key = req.header('Idempotency-Key');
  if (!key) return next();
  if (!req.user?.id) return next(new AppError('Unauthorized', 401));
  if (key.length > 100) return next(new AppError('Idempotency key is too long', 400));

  const requestHash = createHash('sha256')
    .update(JSON.stringify({ method: req.method, path: req.baseUrl + req.path, body: req.body }))
    .digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await prisma.idempotencyRecord.create({
      data: { userId: req.user.id, key, requestHash, expiresAt }
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return next(error);
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { userId_key: { userId: req.user.id, key } }
    });
    if (!existing || existing.expiresAt < new Date()) {
      await prisma.idempotencyRecord.deleteMany({ where: { userId: req.user.id, key } });
      return idempotency(req, res, next);
    }
    if (existing.requestHash !== requestHash) return next(new AppError('Idempotency key was reused with a different request', 409));
    if (existing.status === 'COMPLETED' && existing.statusCode && existing.responseBody) {
      return res.status(existing.statusCode).json(existing.responseBody);
    }
    return next(new AppError('A request with this idempotency key is still processing', 409));
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    const statusCode = res.statusCode;
    const operation = statusCode >= 500
      ? prisma.idempotencyRecord.deleteMany({ where: { userId: req.user!.id, key } })
      : prisma.idempotencyRecord.updateMany({
          where: { userId: req.user!.id, key },
          data: { status: 'COMPLETED', statusCode, responseBody: body as Prisma.InputJsonValue }
        });
    operation
      .catch((error) => console.error('Idempotency response persistence failed', {
        userId: req.user!.id,
        requestId: res.locals.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      .finally(() => originalJson(body));
    return res;
  }) as Response['json'];
  next();
}
