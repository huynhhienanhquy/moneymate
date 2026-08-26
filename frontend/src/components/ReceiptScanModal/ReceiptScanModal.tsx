import React from 'react';
import { ScanLine, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScanResult, useReceiptScanner } from '@/hooks/components/useReceiptScanner';
export type { ScanResult } from '@/hooks/components/useReceiptScanner';

const ReceiptScanModal: React.FC<{
  onClose: () => void;
  onApply: (data: ScanResult) => void;
}> = ({ onClose, onApply }) => {
  const { file, setFile, result, isScanning, scan, reset } = useReceiptScanner();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ScanLine size={20} className="text-brand-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Quét hóa đơn AI</h2>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>

        {!result ? (
          <>
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-500/50 transition">
              <ScanLine size={36} className="text-slate-400" />
              <span className="text-sm text-slate-500">{file ? file.name : 'Chọn ảnh hoặc PDF hóa đơn'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <button onClick={scan} disabled={!file || isScanning}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white font-semibold disabled:opacity-60">
              {isScanning ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
              {isScanning ? 'Đang quét...' : 'Quét hóa đơn'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 text-sm ${result.amount ? 'text-emerald-400' : 'text-amber-400'}`}>
              {result.amount ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {result.amount ? 'Đã nhận diện dữ liệu' : 'Cần kiểm tra lại thủ công'}
              <span className="text-xs text-slate-500 ml-auto">({result.poweredBy})</span>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Số tiền</dt><dd className="font-semibold text-gray-900 dark:text-slate-100">{result.amount?.toLocaleString('vi-VN') || '—'} ₫</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Ngày</dt><dd className="text-gray-900 dark:text-slate-100">{result.transactionDate || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Cửa hàng</dt><dd className="text-gray-900 dark:text-slate-100 truncate ml-4">{result.merchant || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Danh mục gợi ý</dt><dd className="text-brand-400">{result.suggestedCategoryName || '—'}</dd></div>
            </dl>
            <div className="flex gap-3 mt-4">
              <button onClick={reset} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-500">Quét lại</button>
              <button onClick={() => onApply(result)} className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold">Áp dụng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanModal;
