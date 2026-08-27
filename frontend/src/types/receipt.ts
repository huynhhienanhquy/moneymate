export interface ScanResult {
  amount: number | null;
  transactionDate: string | null;
  merchant: string | null;
  note: string | null;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  confidence: string;
  poweredBy: string;
}
