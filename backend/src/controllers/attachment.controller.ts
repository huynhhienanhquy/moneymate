import { Response, NextFunction } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { ExportService } from '../services/export.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';

export class AttachmentController {
  private attachmentService = new AttachmentService();

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

  public getAttachments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const attachments = await this.attachmentService.getAttachments(userId, req.params.transactionId);
      return sendSuccess(res, attachments, 'Attachments retrieved');
    } catch (error) { next(error); }
  };

  public deleteAttachment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.attachmentService.deleteAttachment(userId, req.params.id);
      return sendSuccess(res, null, 'Attachment deleted');
    } catch (error) { next(error); }
  };
}

export class ExportController {
  private exportService = new ExportService();

  public exportExcel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const month = safeParseInt(req.query.month) || new Date().getMonth() + 1;
      const year = safeParseInt(req.query.year) || new Date().getFullYear();
      const buffer = await this.exportService.generateMonthlyExcel(userId, month, year);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report-${month}-${year}.xlsx`);
      return res.send(buffer);
    } catch (error) { next(error); }
  };

  public exportPdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const month = safeParseInt(req.query.month) || new Date().getMonth() + 1;
      const year = safeParseInt(req.query.year) || new Date().getFullYear();
      const buffer = await this.exportService.generateMonthlyPdf(userId, month, year);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${month}-${year}.pdf`);
      return res.send(buffer);
    } catch (error) { next(error); }
  };
}
