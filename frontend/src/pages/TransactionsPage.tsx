import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, Loader2, X, Filter, ChevronDown, Paperclip, ScanLine } from 'lucide-react';
import api from '../services/api';
import ReceiptScanModal, { ScanResult } from '../components/ReceiptScanModal';

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-100">{tx ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
            {[{ v: 'INCOME', l: 'Thu nhập' }, { v: 'EXPENSE', l: 'Chi tiêu' }].map(({ v, l }) => (
              <button
                key={v}
                id={`tx-type-${v.toLowerCase()}`}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: v, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === v
                  ? v === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  : 'text-slate-500'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Số tiền</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₫</span>
              <input
                id="tx-amount"
                type="number"
                min="0"
                step="1000"
                value={form.amount}
                onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition font-mono"
              />
            </div>
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ví</label>
            <div className="relative">
              <select
                id="tx-wallet"
                value={form.walletId}
                onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
                className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition pr-9"
              >
                <option value="">-- Chọn ví --</option>
                {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Category */}
          <div>
  <label className="block text-sm font-medium text-slate-300 mb-1.5">Danh mục</label>
  <select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100">
            <option value="">-- Chọn danh mục --</option>
            {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
</div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ngày</label>
            <input
              id="tx-date"
              type="date"
              value={form.transactionDate}
              onChange={(e) => setForm(p => ({ ...p, transactionDate: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ghi chú <span className="text-slate-600">(tùy chọn)</span></label>
            <input
              id="tx-note"
              type="text"
              value={form.note}
              onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="VD: Ăn tối với bạn bè..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
            />
          </div>

          {!tx && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Hóa đơn <span className="text-slate-600">(JPEG, PNG, PDF – max 5MB)</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700 border-dashed rounded-lg cursor-pointer hover:border-brand-500/50 transition">
                <Paperclip size={16} className="text-slate-500" />
                <span className="text-sm text-slate-400 truncate">{receiptFile ? receiptFile.name : 'Chọn file...'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-sm font-medium hover:bg-slate-800 transition">Hủy</button>
          <button
            id="tx-save"
            onClick={handleSave}
            disabled={loading || !form.walletId || !form.categoryId || !form.amount}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Đang xử lý...' : tx ? 'Lưu' : 'Thêm giao dịch'}
          </button>
        </div>
        {saveError && <p className="text-xs text-rose-400 text-center mt-2">{saveError}</p>}
        {!loading && !saveError && (!form.walletId || !form.categoryId || !form.amount) && (
          <p className="text-xs text-amber-400 text-center mt-2">
            {!form.walletId ? 'Vui lòng chọn ví' : !form.categoryId ? 'Vui lòng chọn danh mục' : 'Vui lòng nhập số tiền'}
          </p>
        )}
      </div>
    </div>
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

  const { data: wallets = [] } = useQuery({ queryKey: ['wallets'], queryFn: () => api.get('/wallets').then(r => r.data.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data.data) });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Giao dịch</h1>
          <p className="text-slate-400 text-sm mt-0.5">Theo dõi toàn bộ thu chi của bạn</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScan(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-500/30 text-brand-400 text-sm font-semibold hover:bg-brand-500/10 transition">
            <ScanLine size={16} /><span>Quét hóa đơn</span>
          </button>
          <button id="add-tx-btn" onClick={() => { setPrefill(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition shadow-md shadow-brand-500/20 active:scale-95">
            <Plus size={16} /><span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="tx-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm kiếm ghi chú..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            id="tx-type-filter"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="pl-9 pr-8 py-2.5 appearance-none bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
          >
            <option value="">Tất cả</option>
            <option value="INCOME">Thu nhập</option>
            <option value="EXPENSE">Chi tiêu</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Search size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-5 py-3.5">Giao dịch</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5 hidden sm:table-cell">Ví</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 px-4 py-3.5 hidden md:table-cell">Ngày</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 px-5 py-3.5">Số tiền</th>
                    <th className="px-4 py-3.5 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx: any) => {
                    const isIncome = tx.type === 'INCOME';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                              {isIncome ? <ArrowUpRight size={15} className="text-emerald-400" /> : <ArrowDownLeft size={15} className="text-rose-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200 leading-tight">{tx.note || tx.category?.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tx.category?.color || '#64748b' }}></span>
                                <p className="text-xs text-slate-500">{tx.category?.name}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-sm text-slate-400">{tx.wallet?.name}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-slate-500">{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isIncome ? '+' : '-'}{formatVND(Number(tx.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                            <button id={`edit-tx-${tx.id}`} onClick={() => setEditTx(tx)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"><Pencil size={13} /></button>
                            <button id={`del-tx-${tx.id}`} onClick={() => { if (confirm('Xóa giao dịch này?')) { setDeletingId(tx.id); deleteMutation.mutate(tx.id); } }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition">
                              {deletingId === tx.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
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
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
                <p className="text-xs text-slate-500">Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} giao dịch</p>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-40 transition">← Trước</button>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-40 transition">Sau →</button>
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
