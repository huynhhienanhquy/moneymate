import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { TransactionService } from './transaction.service';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export class ExportService {
  private transactionService = new TransactionService();

  async generateMonthlyExcel(userId: string, month: number, year: number): Promise<Buffer> {
    const report = await this.transactionService.getMonthlyReport(userId, month, year);
    const { transactions } = await this.transactionService.getTransactions(userId, {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0, 23, 59, 59, 999),
      sortBy: 'transactionDate',
      order: 'desc',
      take: 1000,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Báo cáo T${month}-${year}`);

    sheet.addRow(['MoneyMate - Báo cáo tháng', `${month}/${year}`]);
    sheet.addRow([]);
    sheet.addRow(['Tổng thu nhập', report.summary.totalIncome]);
    sheet.addRow(['Tổng chi tiêu', report.summary.totalExpense]);
    sheet.addRow(['Tiết kiệm', report.summary.netSavings]);
    sheet.addRow([]);
    sheet.addRow(['Danh mục', 'Chi tiêu']);
    report.categoryExpenses.forEach((c: any) => sheet.addRow([c.name, c.amount]));
    sheet.addRow([]);
    sheet.addRow(['Ngày', 'Loại', 'Danh mục', 'Ví', 'Số tiền', 'Ghi chú']);

    transactions.forEach((tx: any) => {
      sheet.addRow([
        new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
        tx.type,
        tx.category?.name,
        tx.wallet?.name,
        Number(tx.amount),
        tx.note || '',
      ]);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async generateMonthlyPdf(userId: string, month: number, year: number): Promise<Buffer> {
    const report = await this.transactionService.getMonthlyReport(userId, month, year);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('MoneyMate - Báo cáo tài chính', { align: 'center' });
      doc.fontSize(14).text(`Tháng ${month}/${year}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Tổng thu nhập: ${formatVND(report.summary.totalIncome)}`);
      doc.text(`Tổng chi tiêu: ${formatVND(report.summary.totalExpense)}`);
      doc.text(`Tiết kiệm: ${formatVND(report.summary.netSavings)}`);
      doc.moveDown();

      doc.fontSize(14).text('Chi tiêu theo danh mục:');
      doc.moveDown(0.5);
      report.categoryExpenses.forEach((c: any) => {
        doc.fontSize(11).text(`  ${c.name}: ${formatVND(c.amount)}`);
      });

      doc.end();
    });
  }
}
