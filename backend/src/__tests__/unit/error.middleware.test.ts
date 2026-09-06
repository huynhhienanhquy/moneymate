import multer from 'multer';
import { errorHandler } from '../../middlewares/error';

function response() {
  const res: any = { locals: { requestId: 'request-1' }, status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('upload error handling', () => {
  it('returns 413 for oversized uploads', () => {
    const res = response();
    errorHandler(new multer.MulterError('LIMIT_FILE_SIZE'), {} as any, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'LIMIT_FILE_SIZE' }));
  });
});
