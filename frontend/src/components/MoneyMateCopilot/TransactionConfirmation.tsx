import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Loader2, ShieldCheck, Trash2, X } from 'lucide-react';
import api from '@/services/api/client';
import { useCategories, useWallets } from '@/hooks/useReferenceData';
import { toLocalDateInputValue } from '@/utils/dateInput';
import { formatVND } from '@/utils/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';
import type { UpdateTransactionDraft } from './transactionToolDefinitions';

interface Transaction {
  id: string;
  version: number;
  amount: string | number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  walletId: string;
  categoryId: string;
  transactionDate: string;
  note: string | null;
  wallet: { name: string };
  category: { name: string; type: string };
}

type UpdateBody = {
  version: number;
  amount?: number;
  type?: 'EXPENSE' | 'INCOME';
  walletId?: string;
  categoryId?: string;
  transactionDate?: string;
  note?: string;
};
type Receipt = { success: true; action: string; transactionId: string; deleted?: true };
type Submission = { transaction: Transaction; body: UpdateBody; key: string; receipt?: Receipt };
type ReferenceItem = { id: string; name: string; type?: string };

const normalize = (value: string) => value.trim().toLocaleLowerCase('vi-VN')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

const resolveName = (items: ReferenceItem[], name: string, label: string) => {
  const matches = items.filter(item => normalize(item.name) === normalize(name));
  if (matches.length !== 1) throw new Error(matches.length
    ? `Có nhiều ${label} tên “${name}”. Vui lòng chọn tên khác để phân biệt.`
    : `Không tìm thấy ${label} “${name}”.`);
  return matches[0];
};

function prepareUpdate(transaction: Transaction, draft: Partial<UpdateTransactionDraft>, wallets: ReferenceItem[], categories: ReferenceItem[]) {
  const body: UpdateBody = { version: transaction.version };
  const changes: Array<{ label: string; before: string; after: string }> = [];
  const type = draft.type ?? transaction.type;
  if (draft.amount !== undefined) {
    if (!Number.isFinite(draft.amount) || draft.amount <= 0) throw new Error('Số tiền phải lớn hơn 0.');
    if (draft.amount !== Number(transaction.amount)) {
      body.amount = draft.amount;
      changes.push({ label: 'Số tiền', before: formatVND(Number(transaction.amount)), after: formatVND(draft.amount) });
    }
  }
  if (draft.type && draft.type !== transaction.type) {
    body.type = draft.type;
    changes.push({ label: 'Loại', before: transaction.type === 'INCOME' ? 'Khoản thu' : 'Khoản chi', after: draft.type === 'INCOME' ? 'Khoản thu' : 'Khoản chi' });
  }
  if (draft.walletName !== undefined) {
    const wallet = resolveName(wallets, draft.walletName, 'ví');
    if (wallet.id !== transaction.walletId) {
      body.walletId = wallet.id;
      changes.push({ label: 'Ví', before: transaction.wallet.name, after: wallet.name });
    }
  }
  if (draft.categoryName !== undefined) {
    const category = resolveName(categories.filter(item => item.type === type), draft.categoryName, 'danh mục');
    if (category.id !== transaction.categoryId) {
      body.categoryId = category.id;
      changes.push({ label: 'Danh mục', before: transaction.category.name, after: category.name });
    }
  } else if (transaction.category.type !== type) {
    throw new Error('Vui lòng chọn danh mục phù hợp với loại giao dịch mới.');
  }
  if (draft.date !== undefined) {
    const parsed = new Date(`${draft.date}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(parsed.getTime())
      || toLocalDateInputValue(parsed) !== draft.date || draft.date > toLocalDateInputValue()) {
      throw new Error('Ngày giao dịch không hợp lệ hoặc sau hôm nay.');
    }
    const originalDate = toLocalDateInputValue(new Date(transaction.transactionDate));
    if (draft.date !== originalDate) {
      body.transactionDate = draft.date;
      changes.push({ label: 'Ngày', before: originalDate, after: draft.date });
    }
  }
  if (draft.note !== undefined && draft.note !== (transaction.note ?? '')) {
    body.note = draft.note;
    changes.push({ label: 'Ghi chú', before: transaction.note || '(Trống)', after: draft.note || '(Trống)' });
  }
  if (!changes.length) throw new Error('Chưa có thông tin thay đổi. Hãy nêu nội dung cần sửa.');
  return { body, changes };
}

/** Keep the reviewed version and request key fixed until the confirmed operation is resolved. */
export function TransactionConfirmation({ mode, draft, toolCallId, respond }: {
  mode: 'update' | 'delete';
  draft: Partial<UpdateTransactionDraft>;
  toolCallId: string;
  respond: (result: unknown) => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);
  const wallets = useWallets();
  const categories = useCategories();
  const transactionQuery = useQuery({
    queryKey: ['copilot-transaction', userId, draft.transactionId],
    queryFn: () => api.get(`/transactions/${encodeURIComponent(draft.transactionId!)}`).then(response => response.data.data as Transaction),
    enabled: !!draft.transactionId,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [submission, setSubmission] = useState<Submission | null>(null);
  const submissionRef = useRef<Submission | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const attempt = useRef(0);
  const title = mode === 'update' ? 'Sửa giao dịch' : 'Xóa giao dịch';
  const action = mode === 'update' ? 'updateTransaction' : 'deleteTransaction';
  const transaction = submission?.transaction ?? transactionQuery.data;
  const needsReferences = mode === 'update' && (draft.walletName !== undefined || draft.categoryName !== undefined);
  const loading = transactionQuery.isLoading || (needsReferences && (wallets.isLoading || categories.isLoading));
  let validationError = '';
  let proposal: ReturnType<typeof prepareUpdate> | undefined;
  if (!draft.transactionId) validationError = 'Chưa xác định được giao dịch. Hãy tìm giao dịch trước.';
  else if (transactionQuery.isError && !submission) validationError = 'Không thể tải giao dịch. Giao dịch có thể đã bị xóa hoặc bạn không có quyền truy cập.';
  else if (needsReferences && (wallets.isError || categories.isError)) validationError = 'Không thể tải ví hoặc danh mục. Vui lòng thử lại.';
  else if (transaction && transaction.type === 'TRANSFER') validationError = 'Không thể sửa hoặc xóa giao dịch chuyển tiền trong luồng này.';
  else if (transaction && transaction.id !== draft.transactionId) validationError = 'Giao dịch trả về không khớp yêu cầu. Vui lòng tải lại.';
  else if (transaction && (!Number.isInteger(transaction.version) || transaction.version < 1)) validationError = 'Không thể xác minh phiên bản giao dịch. Vui lòng tải lại.';
  else if (transaction && mode === 'update' && !loading) {
    try { proposal = prepareUpdate(transaction, draft, wallets.data ?? [], categories.data ?? []); }
    catch (failure) { validationError = (failure as Error).message; }
  }

  const finish = async (result: unknown, saved: boolean) => {
    try { await respond(result); }
    catch { setError(saved ? 'Đã lưu thay đổi nhưng cuộc trò chuyện chưa cập nhật. Nhấn Hoàn tất để thử lại.' : 'Chưa cập nhật được cuộc trò chuyện. Vui lòng thử lại.'); }
  };
  const confirm = async () => {
    if (busyRef.current || conflict) return;
    let pending = submissionRef.current;
    if (!pending) {
      if (!transaction || loading || validationError || (mode === 'update' && !proposal)) return;
      pending = { transaction, body: proposal?.body ?? { version: transaction.version }, key: `copilot-${mode}-${toolCallId}-${attempt.current}` };
      submissionRef.current = pending;
      setSubmission(pending);
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      let receipt = pending.receipt;
      if (!receipt) {
        const path = `/transactions/${encodeURIComponent(pending.transaction.id)}`;
        const headers = { 'Idempotency-Key': pending.key };
        if (mode === 'update') {
          const response = await api.put(path, pending.body, { headers });
          if (response.data.data?.id !== pending.transaction.id) throw new Error('Máy chủ chưa xác nhận giao dịch được cập nhật.');
        } else {
          await api.delete(path, { headers, params: { version: pending.transaction.version } });
        }
        receipt = { success: true, action, transactionId: pending.transaction.id, ...(mode === 'delete' ? { deleted: true as const } : {}) };
        pending = { ...pending, receipt };
        submissionRef.current = pending;
        setSubmission(pending);
        void queryClient.invalidateQueries().catch(() => undefined);
      }
      await finish(receipt, true);
    } catch (failure) {
      const response = (failure as { response?: { status?: number; data?: { code?: string; message?: string } } }).response;
      if (response?.status === 409 && response.data?.code === 'VERSION_CONFLICT') {
        setConflict(true);
        setError('Giao dịch đã thay đổi. Hãy tải lại và kiểm tra thông tin mới trước khi xác nhận.');
      } else if (response?.status && response.status >= 400 && response.status < 500 && ![408, 409, 429].includes(response.status)) {
        submissionRef.current = null;
        setSubmission(null);
        attempt.current += 1;
        setError(response.data?.message || 'Không thể thực hiện thao tác. Vui lòng kiểm tra giao dịch.');
      } else {
        setError('Chưa xác định được kết quả. Nhấn Thử lại để kiểm tra cùng yêu cầu; không gửi một thao tác mới.');
      }
    } finally { busyRef.current = false; setBusy(false); }
  };
  const cancel = async () => {
    if (busyRef.current || (submissionRef.current && !conflict)) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    await finish({ success: false, cancelled: true, action }, false);
    busyRef.current = false;
    setBusy(false);
  };
  const reload = async () => {
    if (busyRef.current || (submissionRef.current && !conflict)) return;
    busyRef.current = true;
    setBusy(true);
    const refreshed = await transactionQuery.refetch();
    if (!refreshed.isError) {
      submissionRef.current = null;
      setSubmission(null);
      setConflict(false);
      setError('');
      attempt.current += 1;
    }
    busyRef.current = false;
    setBusy(false);
  };

  return (
    <section className="app-card space-y-4 border p-4" aria-label={title}>
      <div className="flex items-start gap-3">
        {mode === 'delete' ? <Trash2 className="size-5 text-rose-600" /> : <ShieldCheck className="size-5 text-brand-600" />}
        <div><strong>{title}</strong><p className="text-xs text-slate-500">{mode === 'delete' ? 'Kiểm tra giao dịch trước khi xác nhận xóa.' : 'Chỉ cập nhật sau khi bạn xác nhận.'}</p></div>
      </div>
      {loading && !submission && <p role="status">Đang tải giao dịch...</p>}
      {transaction && (
        <dl className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
          <div><dt className="inline">Giao dịch: </dt><dd className="inline">{transaction.type === 'INCOME' ? 'Khoản thu' : transaction.type === 'TRANSFER' ? 'Chuyển tiền' : 'Khoản chi'} · {formatVND(Number(transaction.amount))}</dd></div>
          <div><dt className="inline">Ví / danh mục: </dt><dd className="inline">{transaction.wallet.name} / {transaction.category.name}</dd></div>
          <div><dt className="inline">Ngày: </dt><dd className="inline">{toLocalDateInputValue(new Date(transaction.transactionDate))}</dd></div>
          <div><dt className="inline">Ghi chú: </dt><dd className="inline">{transaction.note || '(Trống)'}</dd></div>
        </dl>
      )}
      {proposal && <dl className="space-y-2 text-sm" aria-label="Thay đổi đề xuất">{proposal.changes.map(change => <div key={change.label}><dt className="font-semibold">{change.label}</dt><dd>{change.before} → {change.after}</dd></div>)}</dl>}
      {(error || validationError) && <p role="alert" className="flex gap-2 text-sm text-rose-600"><AlertCircle className="size-4 shrink-0" />{error || validationError}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={mode === 'delete' ? 'app-primary-button bg-rose-600' : 'app-primary-button'} disabled={busy || conflict || (!submission && (loading || !!validationError || !transaction))} onClick={() => void confirm()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {submission?.receipt ? 'Hoàn tất' : submission ? 'Thử lại' : mode === 'delete' ? 'Xác nhận xóa' : 'Xác nhận cập nhật'}
        </button>
        <button type="button" className="app-secondary-button" disabled={busy || (!!submission && !conflict)} onClick={() => void cancel()}><X className="size-4" />Hủy</button>
        {(conflict || transactionQuery.isError) && <button type="button" className="app-secondary-button" disabled={busy} onClick={() => void reload()}>Tải lại giao dịch</button>}
      </div>
    </section>
  );
}
