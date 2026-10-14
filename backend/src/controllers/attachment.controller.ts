import { Response, NextFunction } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { ExportService } from '../services/export.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class AttachmentController {
  private attachmentService = new AttachmentService();

  /**
   * Upload attachment required by the attachment workflow.
   *
   * Use it as the HTTP boundary for the attachment route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      if (!req.file) throw new AppError('No file uploaded', 400);
      const attachment = await this.attachmentService.uploadAttachment(
        userId, req.params.transactionId, req.file
      );
      return sendSuccess(res, attachment, 'Attachment uploaded', 201);
    } catch (error) { next(error); }
  };

  /**
   * Return attachments required by the attachment workflow.
   *
   * Use it as the HTTP boundary for the attachment route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getAttachments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const attachments = await this.attachmentService.getAttachments(userId, req.params.transactionId);
      return sendSuccess(res, attachments, 'Attachments retrieved');
    } catch (error) { next(error); }
  };

  /**
   * Delete attachment through the attachment workflow.
   *
   * Use it as the HTTP boundary for the attachment route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteAttachment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.attachmentService.deleteAttachment(userId, req.params.id);
      return sendSuccess(res, null, 'Attachment deleted');
    } catch (error) { next(error); }
  };

  /**
   * Download attachment produced by the attachment workflow.
   *
   * Use it as the HTTP boundary for the attachment route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public downloadAttachment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const { attachment, data } = await this.attachmentService.downloadAttachment(userId, req.params.id);
      const safeFilename = attachment.filename.replace(/[^\x20-\x7E]|[\r\n"\\]/g, '_');
      const encodedFilename = encodeURIComponent(attachment.filename).replace(/[!'()*]/g, (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`
      );
      res.setHeader('Content-Type', attachment.fileType);
      res.setHeader('Content-Length', data.length);
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Cache-Control', 'private, no-store');
      return res.send(data);
    } catch (error) { next(error); }
  };
}

export class ExportController {
  private exportService = new ExportService();

  /**
   * Export excel from the attachment workflow.
   *
   * Use it as the HTTP boundary for the attachment route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public exportExcel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const query = req.query as unknown as { month?: number; year?: number };
      const month = query.month ?? new Date().getMonth() + 1;
      const year = query.year ?? new Date().getFullYear();
      const buffer = await this.exportService.generateMonthlyExcel(userId, month, year);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report-${month}-${year}.xlsx`);
      return res.send(buffer);
    } catch (error) { next(error); }
  };

  /**
   * Export pdf from the attachment workflow.
   *
   * Use it as the HTTP boundary for the attachment route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public exportPdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const query = req.query as unknown as { month?: number; year?: number };
      const month = query.month ?? new Date().getMonth() + 1;
      const year = query.year ?? new Date().getFullYear();
      const buffer = await this.exportService.generateMonthlyPdf(userId, month, year);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${month}-${year}.pdf`);
      return res.send(buffer);
    } catch (error) { next(error); }
  };
}
