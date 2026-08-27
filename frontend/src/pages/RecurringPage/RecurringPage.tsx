import AppTitle from '@/components/common/AppTitle/AppTitle';
import AppSelect from '@/components/common/AppSelect/AppSelect';
import AppInput from '@/components/common/AppInput/AppInput';
import AppLabel from '@/components/common/AppLabel/AppLabel';
import AppButton from '@/components/common/AppButton/AppButton';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Pencil, Trash2, Loader2, X, Pause, Play, Repeat, Search, Filter, MoreVertical, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import api from '@/services/api/client';
import AppModal from '@/components/common/AppModal/AppModal';
import LoadingState from '@/components/common/LoadingState/LoadingState';
import { formatVND } from '@/utils/formatCurrency';
import { useCategories, useWallets } from '@/hooks/useReferenceData';
import PageHeader from '@/components/common/PageHeader/PageHeader';
import SummaryCard from '@/components/common/SummaryCard/SummaryCard';

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần', MONTHLY: 'Hàng tháng', YEARLY: 'Hàng năm',
};

const RecurringModal: React.FC<{ item?: any; wallets: any[]; categories: any[]; onClose: () => void; onSave: (d: any) => void; loading: boolean }> = ({
  item, wallets, categories, onClose, onSave, loading,
}) => {
  const [form, setForm] = useState({
    walletId: item?.walletId || '',
    categoryId: item?.categoryId || '',
    amount: item ? String(item.amount) : '',
    type: item?.type || 'EXPENSE',
    frequency: item?.frequency || 'MONTHLY',
    note: item?.note || '',
    startDate: item ? item.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  const filteredCats = categories.filter((c: any) => c.type === form.type);

  return (
    <AppModal onClose={onClose}>
        <div className="flex items-center justify-between mb-5">
          <AppTitle unstyled level={2} className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{item ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</AppTitle>
          <AppButton unstyled onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition"><X size={20} /></AppButton>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            {['INCOME', 'EXPENSE'].map((t) => (
              <AppButton unstyled key={t} onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.type === t
                  ? t === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
              </AppButton>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₫</span>
            <AppInput unstyled type="number" min="0" placeholder="Số tiền" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              className="app-input pl-8" />
          </div>
          <AppSelect unstyled value={form.walletId} onChange={(e) => setForm(p => ({ ...p, walletId: e.target.value }))}
            className="app-select">
            <option value="">-- Chọn ví --</option>
            {wallets.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({formatVND(Number(w.initialBalance))})</option>)}
          </AppSelect>
          <AppSelect unstyled value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className="app-select">
            <option value="">-- Chọn danh mục --</option>
            {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </AppSelect>
          <AppSelect unstyled value={form.frequency} onChange={(e) => setForm(p => ({ ...p, frequency: e.target.value }))}
            className="app-select">
            {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </AppSelect>
          <AppInput unstyled type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="app-input" />
          <AppInput unstyled type="text" placeholder="Ghi chú (tùy chọn)" value={form.note} onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
            className="app-input" />
        </div>
        <div className="flex gap-3 mt-6">
          <AppButton unstyled onClick={onClose} className="app-secondary-button flex-1">Hủy</AppButton>
          <AppButton unstyled onClick={() => onSave({ ...form, amount: parseFloat(form.amount), startDate: new Date(form.startDate) })}
            disabled={loading || !form.walletId || !form.categoryId || !form.amount}
            className="app-primary-button flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Lưu'}
          </AppButton>
        </div>
    </AppModal>
  );
};

const RecurringPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => api.get('/recurring-transactions').then(r => r.data.data),
  });

  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/recurring-transactions', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/recurring-transactions/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring'] }); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recurring-transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/recurring-transactions/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const incomeTotal = items.filter((item: any) => item.type === 'INCOME').reduce((sum: number, item: any) => sum + Number(item.amount), 0);
  const expenseTotal = items.filter((item: any) => item.type === 'EXPENSE').reduce((sum: number, item: any) => sum + Number(item.amount), 0);
  const visibleItems = items.filter((item: any) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || item.note?.toLowerCase().includes(keyword) || item.category?.name?.toLowerCase().includes(keyword) || item.wallet?.name?.toLowerCase().includes(keyword);
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? item.isActive : !item.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Định kỳ" title="Giao dịch định kỳ" description="Lương, hóa đơn, Netflix... tự động mỗi kỳ" actions={<AppButton unstyled onClick={() => setShowModal(true)} className="app-primary-button"><Plus size={16} /><span>Thêm định kỳ</span></AppButton>} />

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard icon={<Repeat size={18} />} label="Tổng giao dịch" value={String(items.length)} tone="blue" />
            <SummaryCard icon={<ArrowDownRight size={18} />} label="Thu nhập định kỳ" value={formatVND(incomeTotal)} tone="green" />
            <SummaryCard icon={<ArrowUpRight size={18} />} label="Chi tiêu định kỳ" value={formatVND(expenseTotal)} tone="red" />
          </div>

          <section className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AppTitle unstyled level={2} className="font-extrabold text-slate-950 dark:text-white">Danh sách giao dịch</AppTitle>
              <div className="flex gap-2">
                <AppLabel className="relative min-w-0 flex-1 sm:w-72">
                  <span className="sr-only">Tìm kiếm giao dịch định kỳ</span>
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <AppInput unstyled value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm giao dịch..." className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900" />
                </AppLabel>
                <div className="relative">
                  <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <AppSelect unstyled value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 appearance-none rounded-md border border-slate-200 bg-white pl-9 pr-4 font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><option value="ALL">Lọc</option><option value="ACTIVE">Hoạt động</option><option value="PAUSED">Tạm dừng</option></AppSelect>
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-slate-500"><RefreshCw size={30} className="mb-3 opacity-40" /><p className="font-semibold">Không tìm thấy giao dịch định kỳ</p><AppButton unstyled onClick={() => setShowModal(true)} className="app-primary-button mt-4"><Plus size={16} /> Thêm định kỳ</AppButton></div>
              ) : <div className="overflow-x-auto"><table className="w-full min-w-[760px] table-fixed text-left">
                <thead className="border-b border-slate-100 dark:border-slate-800"><tr className="uppercase tracking-wide text-slate-500 dark:text-slate-400"><th className="w-[32%] px-4 py-3">Giao dịch</th><th className="w-[25%] px-3 py-3">Tần suất &amp; ví</th><th className="w-[20%] px-3 py-3">Ngày tiếp theo</th><th className="w-[17%] px-3 py-3 text-right">Số tiền</th><th className="w-[6%] px-2 py-3 text-center">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleItems.map((item: any) => <tr key={item.id} className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!item.isActive ? 'opacity-55' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-rose-100 text-rose-500 dark:bg-rose-500/15'}`}><RefreshCw size={16} /></span><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-bold text-slate-950 dark:text-white">{item.note || item.category?.name}</p><span className={`shrink-0 rounded-full px-2 py-0.5 font-bold uppercase ${item.isActive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{item.isActive ? 'Hoạt động' : 'Tạm dừng'}</span></div><p className="mt-0.5 text-slate-500 dark:text-slate-400">{item.category?.name}</p></div></div></td>
                    <td className="px-3 py-3"><p className="font-semibold text-slate-700 dark:text-slate-300">{FREQ_LABELS[item.frequency]}</p><p className="mt-1 text-slate-500 dark:text-slate-400">Ví: {item.wallet?.name}</p></td>
                    <td className="px-3 py-3"><p className="font-bold text-slate-900 dark:text-white">{new Date(item.nextExecutionDate).toLocaleDateString('vi-VN')}</p><span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">Còn lịch</span></td>
                    <td className={`whitespace-nowrap px-3 py-3 text-right font-extrabold ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'}`}>{item.type === 'INCOME' ? '+' : '-'}{formatVND(Number(item.amount))}</td>
                    <td className="relative px-2 py-3 text-center"><AppButton unstyled aria-label="Mở thao tác" onClick={() => setActionMenuId((id) => id === item.id ? null : item.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreVertical size={17} /></AppButton>{actionMenuId === item.id && <div className="absolute right-3 top-11 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900"><AppButton unstyled onClick={() => { toggleMutation.mutate(item.id); setActionMenuId(null); }} className="flex w-full items-center gap-2 rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">{item.isActive ? <Pause size={15} /> : <Play size={15} />}{item.isActive ? 'Tạm dừng' : 'Kích hoạt'}</AppButton><AppButton unstyled onClick={() => { setEditItem(item); setActionMenuId(null); }} className="flex w-full items-center gap-2 rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={15} />Chỉnh sửa</AppButton><AppButton unstyled onClick={() => { if (confirm('Xóa?')) deleteMutation.mutate(item.id); setActionMenuId(null); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 size={15} />Xóa</AppButton></div>}</td>
                  </tr>)}
                </tbody>
              </table></div>}
            </div>
          </section>
        </>
      )}

      {showModal && <RecurringModal wallets={wallets} categories={categories} onClose={() => setShowModal(false)} onSave={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />}
      {editItem && <RecurringModal item={editItem} wallets={wallets} categories={categories} onClose={() => setEditItem(null)} onSave={(d) => updateMutation.mutate({ id: editItem.id, data: d })} loading={updateMutation.isPending} />}
    </div>
  );
};

export default RecurringPage;
