import AppSelect from '@/components/common/AppSelect/AppSelect';
import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowDownLeft, Pencil, Trash2, Loader2, X, Filter, ChevronDown, Paperclip, ScanLine, CarFront, Utensils, Banknote } from 'lucide-react';
import api from '@/services/api/client';
import AppModal from '@/components/common/AppModal/AppModal';
import ReceiptScanModal, { ScanResult } from '@/components/ReceiptScanModal/ReceiptScanModal';
import LoadingState from '@/components/common/LoadingState/LoadingState';
import { formatVND } from '@/utils/formatCurrency';
import { useCategories, useWallets } from '@/hooks/api/useReferenceData';

const TransactionModal: React.FC<{
  tx?: any; prefill?: any; wallets: any[]; categories: any[];
  onClose: () => void; onSave: (d: any, file?: File) => void; loading: boolean;
}> = ({ tx, prefill, wallets, categories, onClose, onSave, loading }) => {
  const getInitialForm = () => {
    if (tx) return {
      walletId: tx.walletId, categoryId: tx.categoryId, amount: String(tx.amount),
      type: tx.type, note: tx.note || '', transactionDate: tx.transactionDate.slice(0, 10)
    };
    if (prefill) return {
      walletId: prefill.walletId || wallets[0]?.id || '',
      categoryId: prefill.categoryId || '',
      amount: prefill.amount ? String(prefill.amount) : '',
      type: prefill.type || 'EXPENSE', note: prefill.note || '',
      transactionDate: prefill.transactionDate || new Date().toISOString().slice(0, 10),
    };
    return {
      walletId: wallets[0]?.id || '',
      categoryId: '',
      amount: '',
      type: 'EXPENSE',
      note: '',
      transactionDate: new Date().toISOString().slice(0, 10),
    };
  };
  const [form, setForm] = useState(getInitialForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!tx && !prefill && wallets.length > 0 && !form.walletId) {
      setForm(p => ({ ...p, walletId: wallets[0].id }));
    }
  }, [wallets, tx, prefill]);

  const filteredCats = categories.filter((c: any) => c.type === form.type);

  const handleSave = () => {
    if (!form.walletId || !form.categoryId || !form.amount) {
      setSaveError(!form.walletId ? 'Vui lòng chọn ví' : !form.categoryId ? 'Vui lòng nhập đúng tên danh mục' : 'Vui lòng nhập số tiền');
      return;
    }
    setSaveError('');
    try {
      onSave({ ...form, amount: parseFloat(form.amount), transactionDate: new Date(form.transactionDate) }, receiptFile || undefined);
    } catch (e: any) {
      setSaveError(e?.message || 'Thêm giao dịch thất bại');
    }
  };

  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-100">{tx ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}</h2>
          <AppButton unstyled onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"><X size={20} /></AppButton>
        </div>

        <div className="space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            {[{ v: 'INCOME', l: 'Thu nhập' }, { v: 'EXPENSE', l: 'Chi tiêu' }].map(({ v, l }) => (
              <AppButton unstyled
                key={v}
                id={`tx-type-${v.toLowerCase()}`}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: v, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === v
                  ? v === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {l}
              </AppButton>
            ))}
          </div>

          {/* Amount */}
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số tiền</AppLabel>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₫</span>
              <AppInput unstyled
                id="tx-amount"
                type="number"
                min="0"
                step="1000"
                value={form.amount}
                onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                className="app-input pl-8 font-mono"
              />
            </div>
          </div>

          {/* Wallet */}
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ví</AppLabel>
            <div className="relative">
              <AppSelect unstyled
                id="tx-wallet"
                value={form.walletId}
                onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
                className="app-select appearance-none pr-9"
              >
                <option value="">-- Chọn ví --</option>
                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
              </AppSelect>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Category */}
          <div>
  <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Danh mục</AppLabel>
  <AppSelect unstyled value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className="app-select">
            <option value="">-- Chọn danh mục --</option>
            {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </AppSelect>
</div>

          {/* Date */}
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ngày</AppLabel>
            <AppInput unstyled
              id="tx-date"
              type="date"
              value={form.transactionDate}
              onChange={(e) => setForm(p => ({ ...p, transactionDate: e.target.value }))}
              className="app-input"
            />
          </div>

          {/* Note */}
          <div>
            <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú <span className="text-slate-400 dark:text-slate-600">(tùy chọn)</span></AppLabel>
            <AppInput unstyled
              id="tx-note"
              type="text"
              value={form.note}
              onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="VD: Ăn tối với bạn bè..."
              className="app-input"
            />
          </div>

          {!tx && (
            <div>
              <AppLabel className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hóa đơn <span className="text-slate-400 dark:text-slate-600">(JPEG, PNG, PDF - max 5MB)</span>
              </AppLabel>
              <AppLabel className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-dashed rounded-xl cursor-pointer hover:border-brand-500/50 transition">
                <Paperclip size={16} className="text-slate-500" />
                <span className="text-sm text-slate-400 truncate">{receiptFile ? receiptFile.name : 'Chọn file...'}</span>
                <AppInput unstyled type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
              </AppLabel>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled
            id="tx-save"
            onClick={handleSave}
            disabled={loading || !form.walletId || !form.categoryId || !form.amount}
            className="app-primary-button flex-1"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Đang xử lý...' : tx ? 'Lưu' : 'Thêm giao dịch'}
          </AppButton>
        </div>
        {saveError && <p className="text-xs text-rose-400 text-center mt-2">{saveError}</p>}
        {!loading && !saveError && (!form.walletId || !form.categoryId || !form.amount) && (
          <p className="text-xs text-amber-400 text-center mt-2">
            {!form.walletId ? 'Vui lòng chọn ví' : !form.categoryId ? 'Vui lòng chọn danh mục' : 'Vui lòng nhập số tiền'}
          </p>
        )}
    </AppModal>
  );
};

const TransactionsPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);
  const [editTx, setEditTx] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const params: any = { skip: page * PAGE_SIZE, take: PAGE_SIZE, sortBy: 'transactionDate', order: 'desc' };
  if (search) params.search = search;
  if (typeFilter) params.type = typeFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.get('/transactions', { params }).then(r => r.data.data),
    staleTime: 30_000,
  });

  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();

  const createMutation = useMutation({
    mutationFn: async ({ data, file }: { data: any; file?: File }) => {
      const res = await api.post('/transactions', data);
      if (file && res.data.data?.id) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/attachments/transactions/${res.data.data.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['wallets'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/transactions/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['wallets'] }); setEditTx(null); },
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['wallets'] }); setDeletingId(null); },
    onError: () => setDeletingId(null),
  });

  const handleScanApply = (scan: ScanResult) => {
    setPrefill({
      amount: scan.amount,
      categoryId: scan.suggestedCategoryId || '',
      note: scan.note || scan.merchant || '',
      transactionDate: scan.transactionDate || new Date().toISOString().slice(0, 10),
      type: 'EXPENSE',
      walletId: wallets[0]?.id || '',
    });
    setShowScan(false);
    setShowModal(true);
  };

  const transactions: any[] = data?.transactions || [];
  const total: number = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getTransactionIcon = (tx: any) => {
    if (tx.type === 'INCOME') return Banknote;
    const category = String(tx.category?.name || '').toLowerCase();
    if (category.includes('ăn') || category.includes('ẩm thực')) return Utensils;
    if (category.includes('di chuyển') || category.includes('xe')) return CarFront;
    return ArrowDownLeft;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] font-extrabold leading-none tracking-normal text-black dark:text-slate-100">Giao dịch</h1>
          <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">Theo dõi toàn bộ thu chi của bạn</p>
        </div>
        <div className="flex gap-2">
          <AppButton unstyled onClick={() => setShowScan(true)} className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <ScanLine size={12} /><span>Quét hóa đơn</span>
          </AppButton>
          <AppButton unstyled id="add-tx-btn" onClick={() => { setPrefill(null); setShowModal(true); }} className="inline-flex h-8 items-center gap-2 rounded-md bg-[#08b8eb] px-3.5 text-[9px] font-bold text-slate-900 shadow-[0_3px_8px_rgba(8,184,235,0.25)] transition hover:bg-[#00a8d8]">
            <Plus size={12} /><span>Thêm giao dịch</span>
          </AppButton>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <AppInput unstyled
            id="tx-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm kiếm ghi chú..."
            className="h-8 w-full rounded-md border-0 bg-white pl-8 pr-3 text-[10px] font-medium text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-blue-500/20"
          />
        </div>
        <div className="relative">
          <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <AppSelect unstyled
            id="tx-type-filter"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="h-8 appearance-none rounded-md border-0 bg-white pl-8 pr-8 text-[9px] font-semibold text-slate-600 shadow-sm outline-none dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">Tất cả</option>
            <option value="INCOME">Thu nhập</option>
            <option value="EXPENSE">Chi tiêu</option>
          </AppSelect>
          <ChevronDown size={11} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-[10px] border border-white/80 bg-white shadow-[0_7px_20px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <LoadingState className="items-center" />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Search size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <th className="w-[42%] px-3 py-2.5 text-left text-[7px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Giao dịch</th>
                    <th className="w-[24%] px-2 py-2.5 text-left text-[7px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Ví</th>
                    <th className="w-[16%] px-2 py-2.5 text-left text-[7px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Ngày</th>
                    <th className="w-[18%] px-3 py-2.5 text-right text-[7px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {transactions.map((tx: any) => {
                    const isIncome = tx.type === 'INCOME';
                    const TransactionIcon = getTransactionIcon(tx);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-rose-100 dark:bg-rose-500/10'}`}>
                              <TransactionIcon size={11} className={isIncome ? 'text-emerald-600' : 'text-rose-500'} />
                            </div>
                            <div className="min-w-0">
                              <AppButton unstyled type="button" onClick={() => setEditTx(tx)} className="block max-w-full truncate py-0.5 text-left text-[9px] font-bold leading-[1.3] text-slate-950 hover:text-blue-600 dark:text-slate-100">{tx.note || tx.category?.name}</AppButton>
                              <div className="mt-0.5 flex items-center gap-1">
                                <span className="inline-block h-1 w-1 rounded-full" style={{ background: tx.category?.color || '#64748b' }}></span>
                                <p className="truncate text-[7px] leading-[1.4] text-slate-500">{tx.category?.name}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="inline-flex max-w-full truncate rounded bg-slate-100 px-2 py-1 text-[7px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tx.wallet?.name}</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="whitespace-nowrap text-[8px] text-slate-600 dark:text-slate-400">{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</span>
                        </td>
                        <td className="relative px-3 py-2.5 text-right">
                          <span className={`whitespace-nowrap text-[9px] font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isIncome ? '↑ +' : '↓ -'}{formatVND(Number(tx.amount))}
                          </span>
                          <div className="absolute inset-y-0 right-2 flex items-center gap-0.5 bg-white pl-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 dark:bg-slate-900">
                            <AppButton unstyled id={`edit-tx-${tx.id}`} aria-label="Chỉnh sửa giao dịch" onClick={() => setEditTx(tx)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"><Pencil size={11} /></AppButton>
                            <AppButton unstyled id={`del-tx-${tx.id}`} aria-label="Xóa giao dịch" onClick={() => { if (confirm('Xóa giao dịch này?')) { setDeletingId(tx.id); deleteMutation.mutate(tx.id); } }} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                              {deletingId === tx.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} giao dịch</p>
                <div className="flex gap-2">
                  <AppButton unstyled disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-40 transition">← Trước</AppButton>
                  <AppButton unstyled disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-40 transition">Sau →</AppButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <TransactionModal prefill={prefill} wallets={wallets} categories={categories} onClose={() => { setShowModal(false); setPrefill(null); }} onSave={(d, f) => createMutation.mutate({ data: d, file: f })} loading={createMutation.isPending} />}
      {showScan && <ReceiptScanModal onClose={() => setShowScan(false)} onApply={handleScanApply} />}
      {editTx && <TransactionModal tx={editTx} wallets={wallets} categories={categories} onClose={() => setEditTx(null)} onSave={(d) => updateMutation.mutate({ id: editTx.id, data: d })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default TransactionsPage;
