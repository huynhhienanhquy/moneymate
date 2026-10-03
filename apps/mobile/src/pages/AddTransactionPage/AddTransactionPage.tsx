import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import {
  Button,
  Card,
  Field,
  Screen,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { money } from '@/components/finance';
import { ApiError, apiRequest } from '@/lib/api';
import { toLocalDateInputValue, toTransactionTimestamp } from '@/lib/date';
import { useOfflineStorage } from '@/storage/offline';
import type { Category, Transaction, Wallet } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function AddTransactionPage() {
  const params = useLocalSearchParams<{
    id?: string;
    type?: 'EXPENSE' | 'INCOME';
    amount?: string;
    note?: string;
    transactionDate?: string;
    categoryId?: string;
    receiptUri?: string;
    receiptName?: string;
    receiptType?: string;
  }>();
  const { id, type: requestedType } = params;
  const existing = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => apiRequest<Transaction>(`/transactions/${id}`),
    enabled: !!id,
  });

  if (id && existing.isLoading) {
    return (
      <Screen title="Sửa giao dịch">
        <StateMessage loading message="Đang tải giao dịch…" />
      </Screen>
    );
  }

  if (id && existing.isError) {
    return (
      <Screen title="Sửa giao dịch">
        <StateMessage message="Không thể tải giao dịch." />
        <Button
          label="Thử lại"
          onPress={() => {
            void existing.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <TransactionEditor
      key={id || requestedType || 'EXPENSE'}
      id={id}
      requestedType={requestedType}
      existing={existing.data}
      prefill={params}
    />
  );
}

function TransactionEditor({
  id,
  requestedType,
  existing,
  prefill,
}: {
  id?: string;
  requestedType?: 'EXPENSE' | 'INCOME';
  existing?: Transaction;
  prefill: {
    amount?: string;
    note?: string;
    transactionDate?: string;
    categoryId?: string;
    receiptUri?: string;
    receiptName?: string;
    receiptType?: string;
  };
}) {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const offlineStorage = useOfflineStorage();
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiRequest<Wallet[]>('/wallets'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories'),
  });
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(() =>
    existing
      ? existing.type === 'INCOME'
        ? 'INCOME'
        : 'EXPENSE'
      : requestedType || 'EXPENSE',
  );
  const [walletId, setWalletId] = useState(
    () => existing?.walletId || existing?.wallet?.id || '',
  );
  const [categoryId, setCategoryId] = useState(
    () =>
      existing?.categoryId ||
      existing?.category?.id ||
      prefill.categoryId ||
      '',
  );
  const [amount, setAmount] = useState(() =>
    existing ? String(existing.amount) : prefill.amount || '',
  );
  const [note, setNote] = useState(() => existing?.note || prefill.note || '');
  const [transactionDate, setTransactionDate] = useState(
    () =>
      existing?.transactionDate?.slice(0, 10) ||
      prefill.transactionDate?.slice(0, 10) ||
      toLocalDateInputValue(),
  );
  const [queued, setQueued] = useState(false);
  const filteredCategories = useMemo(
    () => categories.data?.filter((category) => category.type === type) || [],
    [categories.data, type],
  );
  const effectiveWalletId = walletId || wallets.data?.[0]?.id || '';
  const effectiveCategoryId = filteredCategories.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : filteredCategories[0]?.id || '';
  const selectedWallet = wallets.data?.find(
    (wallet) => wallet.id === effectiveWalletId,
  );
  const availableBalance = selectedWallet
    ? Number(selectedWallet.initialBalance) -
      (existing?.type === 'INCOME' &&
      (existing.walletId || existing.wallet?.id) === effectiveWalletId
        ? Number(existing.amount)
        : 0)
    : 0;
  const insufficientBalance =
    type === 'EXPENSE' && !!selectedWallet && Number(amount) > availableBalance;
  const numericAmount = Number(amount);
  const invalidAmount = !Number.isFinite(numericAmount) || numericAmount <= 0;
  let transactionDateError = '';
  try {
    toTransactionTimestamp(transactionDate);
  } catch (error) {
    transactionDateError =
      error instanceof Error ? error.message : 'Ngày giao dịch không hợp lệ';
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!effectiveWalletId) throw new Error('Vui lòng chọn ví');
      if (!effectiveCategoryId) throw new Error('Vui lòng chọn danh mục');
      if (invalidAmount) throw new Error('Số tiền phải lớn hơn 0');
      if (insufficientBalance) throw new Error('Số dư không đủ');
      const transactionTimestamp = toTransactionTimestamp(transactionDate);
      const idempotencyKey = Crypto.randomUUID();
      const body = JSON.stringify({
        walletId: effectiveWalletId,
        categoryId: effectiveCategoryId,
        amount: numericAmount,
        type,
        note: note || undefined,
        transactionDate: transactionTimestamp,
        ...(id ? { version: existing?.version } : {}),
      });
      const method = id ? 'PUT' : 'POST';
      const path = id ? `/transactions/${id}` : '/transactions';
      try {
        const transaction = await apiRequest<{ id: string }>(path, {
          method,
          headers: { 'Idempotency-Key': idempotencyKey },
          body,
        });
        if (!id && prefill.receiptUri && transaction?.id) {
          const attachment = new FormData();
          attachment.append('file', {
            uri: prefill.receiptUri,
            name: prefill.receiptName || 'receipt.jpg',
            type: prefill.receiptType || 'image/jpeg',
          } as unknown as Blob);
          try {
            await apiRequest(`/attachments/transactions/${transaction.id}`, {
              method: 'POST',
              body: attachment,
            });
          } catch {
            Alert.alert(
              'Đã lưu giao dịch',
              'Không thể đính kèm ảnh hóa đơn. Bạn có thể thử tải lại ảnh sau.',
            );
          }
        }
        return { transaction, queued: false };
      } catch (error) {
        if (error instanceof ApiError && error.status < 500) throw error;
        if (!userId) throw error;
        await offlineStorage.enqueue(userId, {
          id: idempotencyKey,
          method,
          path,
          body,
        });
        return { transaction: null, queued: true };
      }
    },
    onSuccess: async (result) => {
      await Promise.all(
        [
          'transactions',
          'wallets',
          'dashboard',
          'monthly-report',
          'yearly-report',
          'year-report',
          'monthly-trend',
          'budgets',
        ].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [queryKey] }),
        ),
      );
      if (result.queued) {
        setQueued(true);
        return;
      }

      if (prefill.receiptUri) router.replace('/(tabs)/transactions');
      else router.back();
    },
  });

  return (
    <Screen title={id ? 'Sửa giao dịch' : 'Thêm giao dịch'}>
      <View style={ui.row}>
        {(['EXPENSE', 'INCOME'] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => {
              setType(value);
              setCategoryId('');
            }}
            style={[styles.choice, type === value && styles.choiceActive]}
          >
            <Text style={[ui.text, type === value && styles.choiceText]}>
              {value === 'EXPENSE' ? 'Khoản chi' : 'Khoản thu'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="Số tiền"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <Field
        label="Ngày giao dịch (YYYY-MM-DD)"
        value={transactionDate}
        onChangeText={setTransactionDate}
        placeholder="2026-10-01"
      />
      {!!transactionDateError && (
        <Text accessibilityLiveRegion="polite" style={ui.negative}>
          {transactionDateError}
        </Text>
      )}
      <Text style={ui.muted}>Chọn ví</Text>
      <View style={styles.wrap}>
        {wallets.data?.map((wallet) => (
          <Pressable
            key={wallet.id}
            onPress={() => setWalletId(wallet.id)}
            style={[
              styles.pill,
              effectiveWalletId === wallet.id && styles.pillActive,
            ]}
          >
            <Text style={ui.text}>
              {wallet.name} · {money(wallet.initialBalance)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={ui.muted}>Chọn danh mục</Text>
      <View style={styles.wrap}>
        {filteredCategories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[
              styles.pill,
              effectiveCategoryId === category.id && styles.pillActive,
            ]}
          >
            <Text style={ui.text}>{category.name}</Text>
          </Pressable>
        ))}
      </View>
      {(wallets.isLoading || categories.isLoading) && (
        <StateMessage loading message="Đang tải dữ liệu…" />
      )}
      {(wallets.isError || categories.isError) && (
        <StateMessage message="Không thể tải ví hoặc danh mục. Vui lòng thử lại." />
      )}
      <Field
        label="Ghi chú"
        value={note}
        onChangeText={setNote}
        placeholder="Không bắt buộc"
      />
      {insufficientBalance && (
        <Card>
          <Text accessibilityLiveRegion="polite" style={ui.negative}>
            Số dư không đủ. Số dư khả dụng: {money(availableBalance)}
          </Text>
        </Card>
      )}
      {queued && (
        <Card>
          <Text accessibilityLiveRegion="polite" style={ui.positive}>
            Đã lưu vào hàng đợi. MoneyMate sẽ đồng bộ khi có mạng.
          </Text>
        </Card>
      )}
      {save.isError && (
        <Text accessibilityLiveRegion="polite" style={ui.negative}>
          {save.error.message}
        </Text>
      )}
      <Button
        label={id ? 'Lưu thay đổi' : 'Lưu giao dịch'}
        onPress={() => save.mutate()}
        loading={save.isPending}
        disabled={
          wallets.isLoading ||
          categories.isLoading ||
          wallets.isError ||
          categories.isError ||
          !effectiveWalletId ||
          !effectiveCategoryId ||
          invalidAmount ||
          !!transactionDateError ||
          insufficientBalance ||
          (!!id && !existing)
        }
      />
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    pill: {
      paddingHorizontal: theme.spacing.md - 2,
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: theme.radius.lg - 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    pillActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceRaised,
    },
    choice: {
      flex: 1,
      padding: theme.spacing.md - 2,
      alignItems: 'center',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    choiceActive: { backgroundColor: theme.colors.primaryStrong },
    choiceText: { fontWeight: '700' },
  });
