import multer from 'multer';
import { AppError } from '../common/app-error';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * File filter for upload.
 *
 * Use it in the request pipeline when upload processing is required.
 * @param _req - The req value required by the operation.
 * @param file - The file-system location or file value used by the operation.
 * @param cb - The cb value required by the operation.
 * @returns Nothing; the operation is complete when the function returns.
 */
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WEBP and PDF files are allowed', 400, [], 'INVALID_FILE_TYPE'));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});
