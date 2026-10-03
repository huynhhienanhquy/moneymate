import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  MetricCard,
  PageHero,
  ProgressBar,
  Screen,
  SectionTitle,
  Sheet,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { EntityCard, IconTile, money } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import type { Wallet } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

interface Goal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
}

export default function SavingGoalsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const client = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [fundMode, setFundMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const goals = useQuery({
    queryKey: ['saving-goals'],
    queryFn: () => apiRequest<Goal[]>('/saving-goals'),
  });
  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiRequest<Wallet[]>('/wallets'),
  });
  const mutationError = (title: string) => (error: Error) =>
    Alert.alert(title, error.message || 'Vui lòng thử lại.');
  const save = useMutation({
    mutationFn: () =>
      apiRequest(editing ? `/saving-goals/${editing.id}` : '/saving-goals', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          title: title.trim(),
          targetAmount: Number(target),
          targetDate: date,
        }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['saving-goals'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: mutationError('Không thể lưu mục tiêu'),
  });
  const refreshBalances = () => {
    for (const queryKey of [
      'saving-goals',
      'wallets',
      'dashboard',
      'monthly-report',
      'yearly-report',
      'year-report',
    ])
      client.invalidateQueries({ queryKey: [queryKey] });
  };
  const deposit = useMutation({
    mutationFn: () =>
      apiRequest(`/saving-goals/${selected?.id}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ walletId, amount: Number(amount) }),
      }),
    onSuccess: () => {
      refreshBalances();
      setFundOpen(false);
    },
    onError: mutationError('Không thể nạp tiền'),
  });
  const withdraw = useMutation({
    mutationFn: () =>
      apiRequest(`/saving-goals/${selected?.id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ walletId, amount: Number(amount) }),
      }),
    onSuccess: () => {
      refreshBalances();
      setFundOpen(false);
    },
    onError: mutationError('Không thể rút tiền'),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/saving-goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['saving-goals'] }),
    onError: mutationError('Không thể xóa mục tiêu'),
  });
  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setTarget('');
    setDate(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
    setFormOpen(true);
  };
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setTarget(String(goal.targetAmount));
    setDate(goal.targetDate.slice(0, 10));
    setFormOpen(true);
  };
  const openFund = (goal: Goal, mode: 'deposit' | 'withdraw') => {
    setSelected(goal);
    setFundMode(mode);
    setAmount('');
    setWalletId(wallets.data?.[0]?.id || '');
    setFundOpen(true);
  };
  const items = goals.data || [];
  const saved = items.reduce(
    (sum, goal) => sum + Number(goal.currentAmount),
    0,
  );
  const completed = items.filter((goal) => goal.status === 'COMPLETED').length;
  const visibleItems = items;
  const selectedWallet = wallets.data?.find((wallet) => wallet.id === walletId);
  const insufficientWalletBalance =
    fundMode === 'deposit' &&
    !!selectedWallet &&
    Number(amount) > Number(selectedWallet.initialBalance);

  return (
    <Screen title="Mục tiêu">
      <PageHero
        eyebrow="KẾ HOẠCH TÀI CHÍNH"
        title="Mục tiêu tiết kiệm"
        subtitle="Tiến độ tích lũy thông minh theo thời gian thực"
        icon="piggy-bank-outline"
        action={
          <Pressable style={styles.heroAction} onPress={openCreate}>
            <AppIcon name="plus" size={20} color={theme.colors.primaryStrong} />
            <Text style={styles.heroActionText}>Thêm mục tiêu</Text>
          </Pressable>
        }
      />
      {!!items.length && (
        <View style={styles.metrics}>
          <MetricCard
            label="Tổng mục tiêu"
            value={String(items.length)}
            icon="target"
          />
          <MetricCard
            label="Đã tiết kiệm"
            value={money(saved)}
            icon="trending-up"
            tone="success"
          />
          <MetricCard
            label="Hoàn thành"
            value={`${completed}/${items.length}`}
            icon="trophy-outline"
            tone="danger"
          />
        </View>
      )}
      <SectionTitle
        title="Danh sách mục tiêu"
        caption={`${items.length} mục tiêu hiện tại`}
      />
      {goals.isLoading && <StateMessage loading message="Đang tải mục tiêu…" />}
      {goals.isError && (
        <StateMessage message="Không thể tải danh sách mục tiêu." />
      )}
      {!goals.isLoading && !goals.isError && !items.length && (
        <EmptyState
          icon="target"
          title="Chưa có mục tiêu"
          message="Tạo mục tiêu cho quỹ dự phòng, du lịch hoặc mua sắm."
          action={<Button label="Thêm mục tiêu" onPress={openCreate} />}
        />
      )}
      {visibleItems.map((goal) => (
        <EntityCard
          key={goal.id}
          icon={
            <IconTile
              name={goal.status === 'COMPLETED' ? 'trophy-outline' : 'target'}
              color={
                goal.status === 'COMPLETED'
                  ? theme.colors.danger
                  : theme.colors.primary
              }
              background={
                goal.status === 'COMPLETED'
                  ? theme.colors.dangerSoft
                  : theme.colors.primarySoft
              }
            />
          }
          title={goal.title}
          badge={
            <Badge
              label={
                goal.status === 'COMPLETED'
                  ? 'Hoàn thành'
                  : goal.status === 'EXPIRED'
                    ? 'Quá hạn'
                    : 'Đang tiến hành'
              }
              tone={
                goal.status === 'COMPLETED'
                  ? 'danger'
                  : goal.status === 'EXPIRED'
                    ? 'warning'
                    : 'info'
              }
            />
          }
          trailing={
            <Pressable
              accessibilityLabel={`Tùy chọn ${goal.title}`}
              onPress={() =>
                Alert.alert(goal.title, undefined, [
                  { text: 'Chỉnh sửa', onPress: () => openEdit(goal) },
                  {
                    text: 'Xóa mục tiêu',
                    style: 'destructive',
                    onPress: () => remove.mutate(goal.id),
                  },
                  { text: 'Hủy', style: 'cancel' },
                ])
              }
            >
              <AppIcon
                name="dots-vertical"
                size={24}
                color={theme.colors.muted}
              />
            </Pressable>
          }
        >
          <View style={styles.goalSummary}>
            <View>
              <Text style={ui.muted}>Mục tiêu</Text>
              <Text style={ui.text}>{money(goal.targetAmount)}</Text>
            </View>
            <View>
              <Text style={ui.muted}>Hạn hoàn thành</Text>
              <Text style={ui.text}>
                {new Date(goal.targetDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
          <View style={ui.between}>
            <Text style={ui.muted}>
              Đã góp:{' '}
              <Text style={styles.saved}>{money(goal.currentAmount)}</Text>
            </Text>
            <Text style={ui.text}>Đích đến: {money(goal.targetAmount)}</Text>
          </View>
          <ProgressBar
            value={goal.progress}
            tone={goal.status === 'COMPLETED' ? 'danger' : 'primary'}
          />
          <View style={ui.between}>
            <View style={ui.row}>
              <AppIcon
                name="calendar-blank-outline"
                size={16}
                color={theme.colors.muted}
              />
              <Text style={ui.muted}>
                {new Date(goal.targetDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <Text style={styles.progressText}>
              {Math.round(goal.progress)}%
            </Text>
          </View>
          {goal.status !== 'COMPLETED' && (
            <View style={styles.goalActions}>
              <View style={styles.flex}>
                <Button
                  icon="plus-circle-outline"
                  label="Nạp"
                  onPress={() => openFund(goal, 'deposit')}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  icon="minus-circle-outline"
                  variant="secondary"
                  label="Rút"
                  onPress={() => openFund(goal, 'withdraw')}
                />
              </View>
            </View>
          )}
        </EntityCard>
      ))}
      <Sheet
        visible={formOpen}
        title={editing ? 'Sửa mục tiêu' : 'Mục tiêu mới'}
        onClose={() => setFormOpen(false)}
      >
        <Field label="Tên mục tiêu" value={title} onChangeText={setTitle} />
        <Field
          label="Số tiền mục tiêu"
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
        />
        <Field
          label="Ngày hoàn thành (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
        <Button
          label={editing ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
          loading={save.isPending}
          disabled={!title.trim() || Number(target) <= 0 || !date}
          onPress={() => save.mutate()}
        />
      </Sheet>
      <Sheet
        visible={fundOpen}
        title={`${fundMode === 'deposit' ? 'Nạp vào' : 'Rút từ'} ${selected?.title || ''}`}
        onClose={() => setFundOpen(false)}
      >
        <Text style={ui.muted}>
          {fundMode === 'deposit' ? 'Chọn ví nguồn' : 'Chọn ví nhận'}
        </Text>
        {wallets.data?.map((wallet) => (
          <Pressable
            key={wallet.id}
            onPress={() => setWalletId(wallet.id)}
            style={[
              styles.walletChoice,
              walletId === wallet.id && styles.walletChoiceActive,
            ]}
          >
            <Text style={ui.text}>{wallet.name}</Text>
            <Text style={ui.muted}>{money(wallet.initialBalance)}</Text>
          </Pressable>
        ))}
        <Field
          label="Số tiền"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        {insufficientWalletBalance && (
          <Text accessibilityLiveRegion="polite" style={ui.negative}>
            Số dư không đủ. Số dư khả dụng:{' '}
            {money(selectedWallet.initialBalance)}
          </Text>
        )}
        <Button
          label={fundMode === 'deposit' ? 'Xác nhận nạp' : 'Xác nhận rút'}
          loading={deposit.isPending || withdraw.isPending}
          disabled={
            !walletId ||
            Number(amount) <= 0 ||
            insufficientWalletBalance ||
            (fundMode === 'withdraw' &&
              Number(amount) > Number(selected?.currentAmount || 0))
          }
          onPress={() =>
            fundMode === 'deposit' ? deposit.mutate() : withdraw.mutate()
          }
        />
      </Sheet>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    heroAction: {
      minHeight: 42,
      paddingHorizontal: 14,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.onBrand,
    },
    heroActionText: {
      color: theme.colors.primaryStrong,
      fontSize: 14,
      fontWeight: '900',
    },
    metrics: { flexDirection: 'row', gap: 8 },
    goalSummary: {
      minHeight: 68,
      padding: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceRaised,
    },
    saved: {
      color: theme.colors.primaryStrong,
      fontSize: 18,
      fontWeight: '900',
    },
    progressText: { color: theme.colors.primaryStrong, fontWeight: '900' },
    goalActions: { flexDirection: 'row', gap: 9 },
    walletChoice: {
      minHeight: 58,
      paddingHorizontal: 14,
      borderRadius: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    walletChoiceActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
  });
