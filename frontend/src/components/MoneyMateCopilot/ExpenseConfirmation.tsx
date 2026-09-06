import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api/client';
import { useWallets, useCategories } from '@/hooks/useReferenceData';
import { formatVND } from '@/utils/formatCurrency';
import { toLocalDateInputValue } from '@/utils/dateInput';
import type { ExpenseDraft } from './expenseToolDefinition';

interface ExpenseSubmission {
  key: string;
  body: {
    amount: number;
    walletId: string;
    categoryId: string;
    transactionDate: string;
    note: string;
    type: 'EXPENSE';
  };
  receipt?: {
    success: true;
    transactionId: string;
    amount: number;
    currency: 'VND';
    date: string;
  };
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

export function ExpenseConfirmation({ draft, toolCallId, respond }: {
  draft: ExpenseDraft;
  toolCallId: string;
  respond: (result: unknown) => Promise<void>;
}) {
  const walletsQuery = useWallets();
  const categoriesQuery = useCategories();
  const queryClient = useQueryClient();
  const wallets: Array<{ id: string; name: string }> = walletsQuery.data ?? [];
  const categories: Array<{ id: string; name: string; type: string }> = (categoriesQuery.data ?? [])
    .filter((category: { type: string }) => category.type === 'EXPENSE');
  const [amount, setAmount] = useState(String(draft.amount ?? ''));
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(draft.date || toLocalDateInputValue());
  const [note, setNote] = useState(draft.note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState<ExpenseSubmission | null>(null);
  const locked = submission !== null;
  // State updates are asynchronous; guard repeated clicks in the same render.
  const busyRef = useRef(false);
  const defaultsApplied = useRef(false);
  const attempt = useRef(0);

  useEffect(() => {
    if (defaultsApplied.current || !walletsQuery.data || !categoriesQuery.data) return;
    defaultsApplied.current = true;
    const matchingWallets = wallets.filter(wallet => normalize(wallet.name) === normalize(draft.walletName || ''));
    const matchingCategories = categories.filter(category => normalize(category.name) === normalize(draft.categoryName || ''));
    if (matchingWallets.length === 1) setWalletId(matchingWallets[0].id);
    else if (wallets.length === 1) setWalletId(wallets[0].id);
    if (matchingCategories.length === 1) setCategoryId(matchingCategories[0].id);
  }, [walletsQuery.data, categoriesQuery.data, draft.walletName, draft.categoryName]);

  const finish = async (result: Record<string, unknown>) => {
    try { await respond(result); }
    catch { setError(result.success ? 'Đã lưu giao dịch. Nhấn Hoàn tất để cập nhật cuộc trò chuyện.' : 'Chưa thể cập nhật cuộc trò chuyện. Vui lòng thử lại.'); }
  };

  const save = async () => {
    if (busyRef.current) return;
    let pending = submission;
    if (!pending) {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0 || !wallets.some(w => w.id === walletId) || !categories.some(c => c.id === categoryId)) {
        setError('Vui lòng nhập số tiền lớn hơn 0 và chọn ví, danh mục.');
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toLocalDateInputValue(new Date(`${date}T00:00:00`)) !== date || date > toLocalDateInputValue()) {
        setError('Vui lòng chọn ngày hợp lệ, không sau hôm nay.');
        return;
      }
      pending = {
        key: `copilot-expense-${toolCallId}-${attempt.current}`,
        body: { amount: value, walletId, categoryId, transactionDate: date, note: note.trim(), type: 'EXPENSE' },
      };
    }
    busyRef.current = true;
    setBusy(true);
    setSubmission(pending);
    setError('');
    try {
      let receipt = pending.receipt;
      if (!receipt) {
        const { key, body } = pending;
        const response = await api.post('/transactions', body, { headers: { 'Idempotency-Key': key } });
        receipt = { success: true, transactionId: response.data.data.id, amount: body.amount, currency: 'VND', date: body.transactionDate };
        setSubmission({ ...pending, receipt });
        // The same mutation affects wallets, reports, budgets, savings and AI summaries.
        void queryClient.invalidateQueries().catch(() => undefined);
      }
      await finish(receipt);
    } catch (failure: unknown) {
      const response = (failure as { response?: { status?: number; data?: { message?: string } } }).response;
      if (response?.status && response.status >= 400 && response.status < 500 && ![408, 409, 429].includes(response.status)) {
        // A rejected request is terminal; a corrected form needs a fresh key.
        setSubmission(null);
        attempt.current += 1;
        setError(response.data?.message || 'Không thể lưu khoản chi. Vui lòng kiểm tra thông tin.');
      } else {
        setError('Chưa xác định được kết quả lưu. Nhấn Thử lại để kiểm tra cùng yêu cầu, tránh ghi trùng.');
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (busyRef.current || locked) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try { await finish({ success: false, cancelled: true }); }
    finally { busyRef.current = false; setBusy(false); }
  };

  if (walletsQuery.isLoading || categoriesQuery.isLoading) return <p role="status">Đang tải ví và danh mục...</p>;
  if (!locked && (walletsQuery.isError || categoriesQuery.isError)) return <div role="alert">
    Không thể tải ví hoặc danh mục.
    <button type="button" onClick={() => { void walletsQuery.refetch(); void categoriesQuery.refetch(); }}>Thử tải lại</button>
    <button type="button" disabled={busy} onClick={() => { void cancel(); }}>Hủy</button>
    {error && <p>{error}</p>}
  </div>;

  return <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    onSubmit={event => { event.preventDefault(); void save(); }}>
    <p className="font-bold">Kiểm tra khoản chi</p>
    <p>{amount && Number(amount) > 0 ? formatVND(Number(amount)) : 'Nhập số tiền'} · Chỉ lưu khi bạn xác nhận.</p>
    <fieldset disabled={locked || busy} className="space-y-3">
      <label className="block">Số tiền (đ)<input aria-label="Số tiền (đ)" className="app-input" type="number" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} /></label>
      <label className="block">Ví<select aria-label="Ví" className="app-select" required value={walletId} onChange={event => setWalletId(event.target.value)}>
        <option value="">Chọn ví</option>{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
      </select></label>
      <label className="block">Danh mục<select aria-label="Danh mục" className="app-select" required value={categoryId} onChange={event => setCategoryId(event.target.value)}>
        <option value="">Chọn danh mục</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select></label>
      <label className="block">Ngày<input aria-label="Ngày" className="app-input" type="date" required max={toLocalDateInputValue()} value={date} onChange={event => setDate(event.target.value)} /></label>
      <label className="block">Ghi chú<input aria-label="Ghi chú" className="app-input" maxLength={500} value={note} onChange={event => setNote(event.target.value)} /></label>
    </fieldset>
    {(!wallets.length || !categories.length) && <p role="alert">Bạn cần tạo ví và danh mục chi tiêu trước khi lưu khoản chi.</p>}
    {error && <p role="alert" className="text-rose-600">{error}</p>}
    <div className="flex gap-2">
      <button className="app-primary-button" type="submit" disabled={busy || (!locked && (!wallets.length || !categories.length))}>
        {busy ? 'Đang xử lý...' : submission?.receipt ? 'Hoàn tất' : locked ? 'Thử lại' : 'Xác nhận lưu'}
      </button>
      <button type="button" disabled={busy || locked} onClick={() => { void cancel(); }}>Hủy</button>
    </div>
  </form>;
}
