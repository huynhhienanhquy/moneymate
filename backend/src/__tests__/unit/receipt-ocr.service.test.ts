import fs from 'fs';
import os from 'os';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { ReceiptOcrService } from '../../services/ai/receipt-ocr.service';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({ text: 'TOTAL 123000 VND' }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('ReceiptOcrService PDF extraction', () => {
  it('uses the pdf-parse v2 class API and extracts text', async () => {
    const filePath = path.join(os.tmpdir(), `moneymate-pdf-test-${Date.now()}.pdf`);
    await fs.promises.writeFile(filePath, Buffer.from('PDF fixture'));
    try {
      const text = await (new ReceiptOcrService() as any).extractPdfText(filePath);
      expect(text).toContain('TOTAL 123000 VND');
      expect(PDFParse).toHaveBeenCalledWith({ data: Buffer.from('PDF fixture') });
    } finally {
      await fs.promises.rm(filePath, { force: true });
    }
  });
});
