import fs from 'fs';
import path from 'path';
import { CategoryRepository } from '../../repositories/category.repository';
import { LlmProvider } from './llm.provider';
import { CategoryType } from '@prisma/client';

export interface ReceiptScanResult {
  amount: number | null;
  transactionDate: string | null;
  merchant: string | null;
  note: string | null;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  confidence: 'high' | 'medium' | 'low';
  rawText?: string;
  poweredBy: 'openai' | 'parser' | 'manual';
}

const MERCHANT_CATEGORY_MAP: Record<string, string[]> = {
  'Ăn uống': ['cafe', 'coffee', 'starbucks', 'highlands', 'phuc long', 'kfc', 'lotteria', 'pizza', 'restaurant', 'nhà hàng', 'quán', 'food', 'grab food', 'shopee food'],
  'Di chuyển': ['grab', 'be ', 'gojek', 'taxi', 'uber', 'xăng', 'petrol', 'shell', 'pvoil', 'bãi xe', 'parking'],
  'Mua sắm': ['winmart', 'coopmart', 'big c', 'lotte mart', 'aeon', 'shopee', 'lazada', 'tiki', 'uniqlo', 'shop'],
  'Giải trí': ['netflix', 'spotify', 'cgv', 'galaxy', 'game', 'steam'],
  'Hóa đơn & Tiện ích': ['evn', 'điện', 'nước', 'internet', 'viettel', 'vnpt', 'fpt', 'mobifone'],
  'Sức khỏe': ['pharmacy', 'nhà thuốc', 'long châu', 'pharmacity', 'bệnh viện', 'clinic'],
};

export class ReceiptOcrService {
  private categoryRepository = new CategoryRepository();
  private llm = new LlmProvider();

  async scanReceipt(userId: string, file: Express.Multer.File): Promise<ReceiptScanResult> {
    const filePath = path.join(process.cwd(), 'uploads', file.filename);
    let rawText = '';

    try {
      if (file.mimetype === 'application/pdf') {
        rawText = await this.extractPdfText(filePath);
      } else if (this.llm.isAvailable()) {
        const base64 = fs.readFileSync(filePath).toString('base64');
        const visionResult = await this.llm.analyzeImage(
          base64,
          file.mimetype,
          `Đọc hóa đơn tiền Việt Nam. Trả về JSON thuần (không markdown):
{"amount": number, "date": "YYYY-MM-DD", "merchant": "string", "items": "string"}
amount là tổng tiền VND (số nguyên). Nếu không đọc được thì null.`
        );
        if (visionResult) {
          const parsed = this.parseJsonFromText(visionResult);
          if (parsed) {
            return await this.buildResult(userId, {
              amount: parsed.amount,
              date: parsed.date,
              merchant: parsed.merchant,
              note: parsed.items,
              rawText: visionResult,
              poweredBy: 'openai',
            });
          }
        }
      }

      if (!rawText && file.mimetype.startsWith('image/')) {
        rawText = await this.extractImageText(filePath);
      }

      return await this.parseReceiptText(userId, rawText || file.originalname);
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  private async extractPdfText(filePath: string): Promise<string> {
    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch {
      return '';
    }
  }

  private async extractImageText(filePath: string): Promise<string> {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('vie+eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      return text || '';
    } catch {
      return '';
    }
  }

  private async parseReceiptText(userId: string, text: string): Promise<ReceiptScanResult> {
    const amount = this.extractAmount(text);
    const transactionDate = this.extractDate(text);
    const merchant = this.extractMerchant(text);
    const suggested = await this.suggestCategory(userId, text + ' ' + (merchant || ''));

    return {
      amount,
      transactionDate,
      merchant,
      note: merchant ? `Hóa đơn ${merchant}` : null,
      suggestedCategoryId: suggested?.id || null,
      suggestedCategoryName: suggested?.name || null,
      confidence: amount ? (transactionDate ? 'medium' : 'low') : 'low',
      rawText: text.slice(0, 500),
      poweredBy: 'parser',
    };
  }

  private async buildResult(userId: string, data: {
    amount: number | null;
    date: string | null;
    merchant: string | null;
    note: string | null;
    rawText: string;
    poweredBy: 'openai' | 'parser';
  }): Promise<ReceiptScanResult> {
    const suggested = await this.suggestCategory(userId, (data.merchant || '') + ' ' + (data.note || ''));
    return {
      amount: data.amount,
      transactionDate: data.date,
      merchant: data.merchant,
      note: data.note,
      suggestedCategoryId: suggested?.id || null,
      suggestedCategoryName: suggested?.name || null,
      confidence: data.amount ? 'high' : 'medium',
      rawText: data.rawText.slice(0, 500),
      poweredBy: data.poweredBy,
    };
  }

  private extractAmount(text: string): number | null {
    const patterns = [
      /(?:tổng|total|thành tiền|thanh toán|amount)[:\s]*([\d.,]+)/gi,
      /([\d]{1,3}(?:[.,]\d{3})+)\s*(?:đ|vnd|vnđ)/gi,
      /(?:^|\s)([\d]{5,9})(?:\s|$)/g,
    ];

    const candidates: number[] = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const num = parseInt(match[1].replace(/[.,]/g, ''), 10);
        if (num >= 1000 && num <= 500_000_000) candidates.push(num);
      }
    }

    return candidates.length > 0 ? Math.max(...candidates) : null;
  }

  private extractDate(text: string): string | null {
    const patterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const day = m[1].padStart(2, '0');
        const month = m[2].padStart(2, '0');
        let year = m[3];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  }

  private extractMerchant(text: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines[0]?.slice(0, 80) || null;
  }

  private async suggestCategory(userId: string, text: string): Promise<{ id: string; name: string } | null> {
    const categories = await this.categoryRepository.findAllByUserId(userId);
    const expenseCats = categories.filter(c => c.type === CategoryType.EXPENSE);
    const lower = text.toLowerCase();

    for (const [catName, keywords] of Object.entries(MERCHANT_CATEGORY_MAP)) {
      if (keywords.some(kw => lower.includes(kw))) {
        const cat = expenseCats.find(c => c.name === catName);
        if (cat) return { id: cat.id, name: cat.name };
      }
    }

    return expenseCats.find(c => c.name === 'Khác (Chi tiêu)')
      ? { id: expenseCats.find(c => c.name === 'Khác (Chi tiêu)')!.id, name: 'Khác (Chi tiêu)' }
      : expenseCats[0] ? { id: expenseCats[0].id, name: expenseCats[0].name } : null;
  }

  private parseJsonFromText(text: string): { amount: number | null; date: string | null; merchant: string | null; items: string | null } | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        amount: parsed.amount ? Number(parsed.amount) : null,
        date: parsed.date || null,
        merchant: parsed.merchant || null,
        items: parsed.items || null,
      };
    } catch {
      return null;
    }
  }
}
