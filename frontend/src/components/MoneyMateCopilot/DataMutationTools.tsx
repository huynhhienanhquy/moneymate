import { useRef, useState, type ReactNode } from 'react';
import { useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Loader2, ShieldCheck, X } from 'lucide-react';
import api from '@/services/api/client';
import { useCategories, useWallets } from '@/hooks/useReferenceData';
import { formatVND } from '@/utils/formatCurrency';
import {
  createBudgetToolDefinition,
  createCategoryToolDefinition,
  createRecurringToolDefinition,
  createSavingGoalToolDefinition,
  createWalletToolDefinition,
  recordIncomeToolDefinition,
  transferFundsToolDefinition,
  type CreateBudgetDraft,
  type CreateCategoryDraft,
  type CreateRecurringDraft,
  type CreateSavingGoalDraft,
  type CreateWalletDraft,
  type RecordIncomeDraft,
  type TransferFundsDraft,
} from './actionToolDefinitions';

type ToolRespond = (result: unknown) => Promise<void>;
type ReferenceItem = { id: string; name: string; type?: string };

interface ConfirmationProps {
  title: string;
  description: string;
  details: Array<{ label: string; value: ReactNode }>;
  execute: () => Promise<Record<string, unknown>>;
  respond: ToolRespond;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

const findByName = (items: ReferenceItem[], name: string, kind: string) => {
  const matches = items.filter(
    (item) => normalize(item.name) === normalize(name),
  );
  if (matches.length === 1) return matches[0];
  if (!matches.length) throw new Error(`Không tìm thấy ${kind} “${name}”.`);
  throw new Error(
    `Có nhiều ${kind} tên “${name}”. Vui lòng đổi tên để phân biệt.`,
  );
};

const toTimestamp = (value: string, allowFuture: boolean) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error('Ngày phải có định dạng YYYY-MM-DD.');
  const [year, month, day] = value.split('-').map(Number);
  const timestamp = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    timestamp.getUTCFullYear() !== year ||
    timestamp.getUTCMonth() !== month - 1 ||
    timestamp.getUTCDate() !== day
  ) {
    throw new Error('Ngày không hợp lệ.');
  }
  if (!allowFuture && value > new Date().toISOString().slice(0, 10)) {
    throw new Error('Ngày giao dịch không được ở tương lai.');
  }
  return timestamp.toISOString();
};

const apiErrorMessage = (error: unknown) => {
  const response = (error as { response?: { data?: { message?: string } } })
    .response;
  return (
    response?.data?.message ||
    (error instanceof Error ? error.message : 'Không thể hoàn tất thao tác.')
  );
};

function MutationConfirmation({
  title,
  description,
  details,
  execute,
  respond,
}: ConfirmationProps) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const busyRef = useRef(false);

  const finish = async (result: Record<string, unknown>) => {
    try {
      await respond(result);
    } catch {
      setError(
        result.success
          ? 'Dữ liệu đã được lưu nhưng cuộc trò chuyện chưa cập nhật. Nhấn Hoàn tất để thử lại.'
          : 'Chưa thể cập nhật cuộc trò chuyện. Vui lòng thử lại.',
      );
    }
  };

  const confirm = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const result = receipt || (await execute());
      if (!receipt) {
        setReceipt(result);
        void queryClient.invalidateQueries().catch(() => undefined);
      }
      await finish(result);
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (busyRef.current || receipt) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await finish({ success: false, cancelled: true, action: title });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <section
      className="app-card space-y-4 border border-brand-100 p-4 dark:border-brand-500/20"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
          <ShieldCheck className="size-5" />
        </span>
        <span className="min-w-0">
          <strong className="block text-sm text-slate-900 dark:text-slate-100">
            {title}
          </strong>
          <small className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </small>
        </span>
      </div>

      <dl className="grid gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/70">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-start justify-between gap-4"
          >
            <dt className="text-slate-500 dark:text-slate-400">
              {detail.label}
            </dt>
            <dd className="text-right font-semibold text-slate-900 dark:text-slate-100">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>

      {error && (
        <p
          className="flex items-start gap-2 text-xs text-rose-600"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          className="app-primary-button flex-1"
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {receipt ? 'Hoàn tất' : 'Xác nhận lưu'}
        </button>
        {!receipt && (
          <button
            className="app-secondary-button"
            type="button"
            disabled={busy}
            onClick={() => void cancel()}
          >
            <X className="size-4" /> Hủy
          </button>
        )}
      </div>
    </section>
  );
}

const completedState = (result: string | undefined, successLabel: string) => {
  try {
    const parsed = JSON.parse(result || '{}') as {
      success?: boolean;
      cancelled?: boolean;
    };
    if (parsed.success) return successLabel;
    if (parsed.cancelled) return 'Đã hủy thao tác.';
  } catch {
    // Invalid results are never treated as successful writes.
  }
  return 'Thao tác chưa được lưu.';
};

function CategoryConfirmation({
  draft,
  respond,
}: {
  draft: CreateCategoryDraft;
  respond: ToolRespond;
}) {
  const color = draft.color || '#2563EB';
  const icon = draft.icon || 'tag';
  return (
    <MutationConfirmation
      title="Tạo danh mục"
      description="Danh mục chỉ được tạo sau khi bạn xác nhận."
      details={[
        { label: 'Tên', value: draft.name },
        {
          label: 'Loại',
          value: draft.type === 'EXPENSE' ? 'Khoản chi' : 'Khoản thu',
        },
        { label: 'Màu', value: color },
      ]}
      respond={respond}
      execute={async () => {
        if (!/^#[0-9a-f]{6}$/i.test(color))
          throw new Error('Màu danh mục phải là mã HEX gồm 6 ký tự.');
        const response = await api.post('/categories', {
          name: draft.name.trim(),
          type: draft.type,
          color,
          icon,
        });
        return {
          success: true,
          action: 'createCategory',
          categoryId: response.data.data.id,
          name: draft.name,
        };
      }}
    />
  );
}

function WalletConfirmation({
  draft,
  respond,
}: {
  draft: CreateWalletDraft;
  respond: ToolRespond;
}) {
  return (
    <MutationConfirmation
      title="Tạo ví"
      description="Kiểm tra thông tin ví trước khi lưu."
      details={[
        { label: 'Tên ví', value: draft.name },
        { label: 'Loại', value: draft.type },
        { label: 'Số dư đầu', value: formatVND(draft.initialBalance || 0) },
      ]}
      respond={respond}
      execute={async () => {
        const response = await api.post('/wallets', {
          name: draft.name.trim(),
          type: draft.type,
          currency: 'VND',
          initialBalance: draft.initialBalance || 0,
        });
        return {
          success: true,
          action: 'createWallet',
          walletId: response.data.data.id,
          name: draft.name,
        };
      }}
    />
  );
}

function BudgetConfirmation({
  draft,
  respond,
}: {
  draft: CreateBudgetDraft;
  respond: ToolRespond;
}) {
  const categoriesQuery = useCategories();
  return (
    <MutationConfirmation
      title="Tạo ngân sách"
      description="Ngân sách sẽ áp dụng cho tháng đã chọn."
      details={[
        { label: 'Hạn mức', value: formatVND(draft.amount) },
        { label: 'Danh mục', value: draft.categoryName || 'Tổng chi tiêu' },
        { label: 'Thời gian', value: `${draft.month}/${draft.year}` },
      ]}
      respond={respond}
      execute={async () => {
        if (categoriesQuery.isLoading)
          throw new Error('Danh mục đang được tải. Vui lòng thử lại.');
        if (categoriesQuery.isError) throw new Error('Không thể tải danh mục.');
        const category = draft.categoryName
          ? findByName(
              categoriesQuery.data || [],
              draft.categoryName,
              'danh mục',
            )
          : null;
        const response = await api.post('/budgets', {
          amount: draft.amount,
          categoryId: category?.id || null,
          month: draft.month,
          year: draft.year,
        });
        return {
          success: true,
          action: 'createBudget',
          budgetId: response.data.data.id,
        };
      }}
    />
  );
}

function SavingGoalConfirmation({
  draft,
  respond,
}: {
  draft: CreateSavingGoalDraft;
  respond: ToolRespond;
}) {
  return (
    <MutationConfirmation
      title="Tạo mục tiêu tiết kiệm"
      description="Mục tiêu chỉ được tạo sau khi bạn xác nhận."
      details={[
        { label: 'Mục tiêu', value: draft.title },
        { label: 'Số tiền', value: formatVND(draft.targetAmount) },
        { label: 'Hạn hoàn thành', value: draft.targetDate },
      ]}
      respond={respond}
      execute={async () => {
        const response = await api.post('/saving-goals', {
          title: draft.title.trim(),
          targetAmount: draft.targetAmount,
          targetDate: toTimestamp(draft.targetDate, true),
        });
        return {
          success: true,
          action: 'createSavingGoal',
          goalId: response.data.data.id,
          title: draft.title,
        };
      }}
    />
  );
}

function RecurringConfirmation({
  draft,
  respond,
}: {
  draft: CreateRecurringDraft;
  respond: ToolRespond;
}) {
  const walletsQuery = useWallets();
  const categoriesQuery = useCategories();
  return (
    <MutationConfirmation
      title="Tạo giao dịch định kỳ"
      description="MoneyMate sẽ lập lịch sau khi bạn xác nhận."
      details={[
        { label: 'Nội dung', value: draft.note || draft.categoryName },
        { label: 'Số tiền', value: formatVND(draft.amount) },
        { label: 'Ví', value: draft.walletName },
        { label: 'Danh mục', value: draft.categoryName },
        { label: 'Chu kỳ', value: draft.frequency },
        { label: 'Bắt đầu', value: draft.startDate },
      ]}
      respond={respond}
      execute={async () => {
        if (walletsQuery.isLoading || categoriesQuery.isLoading)
          throw new Error('Ví và danh mục đang được tải.');
        if (walletsQuery.isError || categoriesQuery.isError)
          throw new Error('Không thể tải ví hoặc danh mục.');
        const wallet = findByName(
          walletsQuery.data || [],
          draft.walletName,
          'ví',
        );
        const categories = (categoriesQuery.data || []).filter(
          (item: ReferenceItem) => item.type === draft.type,
        );
        const category = findByName(categories, draft.categoryName, 'danh mục');
        const response = await api.post('/recurring-transactions', {
          walletId: wallet.id,
          categoryId: category.id,
          amount: draft.amount,
          type: draft.type,
          frequency: draft.frequency,
          note: draft.note || undefined,
          startDate: toTimestamp(draft.startDate, true),
        });
        return {
          success: true,
          action: 'createRecurringTransaction',
          recurringId: response.data.data.id,
        };
      }}
    />
  );
}

function IncomeConfirmation({
  draft,
  respond,
  toolCallId,
}: {
  draft: RecordIncomeDraft;
  respond: ToolRespond;
  toolCallId: string;
}) {
  const walletsQuery = useWallets();
  const categoriesQuery = useCategories();
  return (
    <MutationConfirmation
      title="Ghi khoản thu"
      description="Khoản thu chỉ được lưu sau khi bạn xác nhận."
      details={[
        { label: 'Số tiền', value: formatVND(draft.amount) },
        { label: 'Ví', value: draft.walletName },
        { label: 'Danh mục', value: draft.categoryName },
        { label: 'Ngày', value: draft.date },
      ]}
      respond={respond}
      execute={async () => {
        if (walletsQuery.isLoading || categoriesQuery.isLoading)
          throw new Error('Ví và danh mục đang được tải.');
        const wallet = findByName(
          walletsQuery.data || [],
          draft.walletName,
          'ví',
        );
        const category = findByName(
          (categoriesQuery.data || []).filter(
            (item: ReferenceItem) => item.type === 'INCOME',
          ),
          draft.categoryName,
          'danh mục thu nhập',
        );
        const response = await api.post(
          '/transactions',
          {
            walletId: wallet.id,
            categoryId: category.id,
            amount: draft.amount,
            type: 'INCOME',
            note: draft.note || undefined,
            transactionDate: toTimestamp(draft.date, false),
          },
          { headers: { 'Idempotency-Key': `copilot-income-${toolCallId}` } },
        );
        return {
          success: true,
          action: 'recordIncome',
          transactionId: response.data.data.id,
        };
      }}
    />
  );
}

function TransferConfirmation({
  draft,
  respond,
  toolCallId,
}: {
  draft: TransferFundsDraft;
  respond: ToolRespond;
  toolCallId: string;
}) {
  const walletsQuery = useWallets();
  return (
    <MutationConfirmation
      title="Chuyển tiền"
      description="Tiền chỉ được chuyển sau khi bạn xác nhận."
      details={[
        { label: 'Từ ví', value: draft.sourceWalletName },
        { label: 'Đến ví', value: draft.destinationWalletName },
        { label: 'Số tiền', value: formatVND(draft.amount) },
        { label: 'Ngày', value: draft.date },
      ]}
      respond={respond}
      execute={async () => {
        if (walletsQuery.isLoading)
          throw new Error('Danh sách ví đang được tải.');
        const wallets = walletsQuery.data || [];
        const source = findByName(wallets, draft.sourceWalletName, 'ví nguồn');
        const destination = findByName(
          wallets,
          draft.destinationWalletName,
          'ví nhận',
        );
        if (source.id === destination.id)
          throw new Error('Ví nguồn và ví nhận phải khác nhau.');
        const response = await api.post(
          '/transactions/transfer',
          {
            sourceWalletId: source.id,
            destinationWalletId: destination.id,
            amount: draft.amount,
            note: draft.note || undefined,
            transferDate: toTimestamp(draft.date, false),
          },
          { headers: { 'Idempotency-Key': `copilot-transfer-${toolCallId}` } },
        );
        if (response.data.data !== true)
          throw new Error('Máy chủ chưa xác nhận giao dịch chuyển tiền.');
        return { success: true, action: 'transferFunds', transferred: true };
      }}
    />
  );
}

export function DataMutationTools() {
  useHumanInTheLoop({
    ...createCategoryToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result }) =>
      status === 'executing' && respond ? (
        <CategoryConfirmation draft={args} respond={respond} />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị danh mục...'
            : completedState(result, 'Đã tạo danh mục.')}
        </p>
      ),
  });
  useHumanInTheLoop({
    ...createWalletToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result }) =>
      status === 'executing' && respond ? (
        <WalletConfirmation draft={args} respond={respond} />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị ví...'
            : completedState(result, 'Đã tạo ví.')}
        </p>
      ),
  });
  useHumanInTheLoop({
    ...createBudgetToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result }) =>
      status === 'executing' && respond ? (
        <BudgetConfirmation draft={args} respond={respond} />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị ngân sách...'
            : completedState(result, 'Đã tạo ngân sách.')}
        </p>
      ),
  });
  useHumanInTheLoop({
    ...createSavingGoalToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result }) =>
      status === 'executing' && respond ? (
        <SavingGoalConfirmation draft={args} respond={respond} />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị mục tiêu...'
            : completedState(result, 'Đã tạo mục tiêu tiết kiệm.')}
        </p>
      ),
  });
  useHumanInTheLoop({
    ...createRecurringToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result }) =>
      status === 'executing' && respond ? (
        <RecurringConfirmation draft={args} respond={respond} />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị lịch định kỳ...'
            : completedState(result, 'Đã tạo giao dịch định kỳ.')}
        </p>
      ),
  });
  useHumanInTheLoop({
    ...recordIncomeToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result, toolCallId }) =>
      status === 'executing' && respond ? (
        <IncomeConfirmation
          draft={args}
          respond={respond}
          toolCallId={toolCallId}
        />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị khoản thu...'
            : completedState(result, 'Đã lưu khoản thu.')}
        </p>
      ),
  });
  useHumanInTheLoop({
    ...transferFundsToolDefinition,
    agentId: 'default',
    render: ({ args, status, respond, result, toolCallId }) =>
      status === 'executing' && respond ? (
        <TransferConfirmation
          draft={args}
          respond={respond}
          toolCallId={toolCallId}
        />
      ) : (
        <p role="status">
          {status === 'inProgress'
            ? 'Đang chuẩn bị chuyển tiền...'
            : completedState(result, 'Đã chuyển tiền.')}
        </p>
      ),
  });

  return null;
}

export default DataMutationTools;
