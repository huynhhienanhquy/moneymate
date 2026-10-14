import { SummaryTile, SectionHeading } from '@/components/design';
import { Text } from '@/components/design-text';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import {
  Button,
  EmptyState,
  Field,
  PageHero,
  ProgressBar,
  Screen,
  Sheet,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { money } from '@/components/finance';
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

/**
 * Render the saving goals page interface.
 *
 * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered saving goals page interface.
 */
export default function SavingGoalsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const client = useQueryClient();
  const [today] = useState(() => Date.now());
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
    /**
     * Load saving goals page data for the query cache.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting saving goals page value for the caller.
     */
    queryFn: () => apiRequest<Goal[]>('/saving-goals'),
  });
  const wallets = useQuery({
    queryKey: ['wallets'],
    /**
     * Load saving goals page data for the query cache.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting saving goals page value for the caller.
     */
    queryFn: () => apiRequest<Wallet[]>('/wallets'),
  });
  /**
   * Mutation error for saving goals page.
   *
   * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
   * @param title - The title value required by the operation.
   * @returns The resulting saving goals page value for the caller.
   */
  const mutationError = (title: string) => (error: Error) =>
    Alert.alert(title, error.message || 'Vui lòng thử lại.');
  const save = useMutation({
    /**
     * Execute the saving goals page mutation requested by the client.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting saving goals page value for the caller.
     */
    mutationFn: () =>
      apiRequest(editing ? `/saving-goals/${editing.id}` : '/saving-goals', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          title: title.trim(),
          targetAmount: Number(target),
          targetDate: date,
        }),
      }),
    /**
     * Finalize the saving goals page workflow after a successful operation.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['saving-goals'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: mutationError('Không thể lưu mục tiêu'),
  });
  /**
   * Refresh balances used by the saving goals page workflow.
   *
   * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
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
    /**
     * Execute the saving goals page mutation requested by the client.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting saving goals page value for the caller.
     */
    mutationFn: () =>
      apiRequest(`/saving-goals/${selected?.id}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ walletId, amount: Number(amount) }),
      }),
    /**
     * Finalize the saving goals page workflow after a successful operation.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: () => {
      refreshBalances();
      setFundOpen(false);
    },
    onError: mutationError('Không thể nạp tiền'),
  });
  const withdraw = useMutation({
    /**
     * Execute the saving goals page mutation requested by the client.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting saving goals page value for the caller.
     */
    mutationFn: () =>
      apiRequest(`/saving-goals/${selected?.id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ walletId, amount: Number(amount) }),
      }),
    /**
     * Finalize the saving goals page workflow after a successful operation.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: () => {
      refreshBalances();
      setFundOpen(false);
    },
    onError: mutationError('Không thể rút tiền'),
  });
  const remove = useMutation({
    /**
     * Execute the saving goals page mutation requested by the client.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting saving goals page value for the caller.
     */
    mutationFn: (id: string) =>
      apiRequest(`/saving-goals/${id}`, { method: 'DELETE' }),
    /**
     * Finalize the saving goals page workflow after a successful operation.
     *
     * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting saving goals page value for the caller.
     */
    onSuccess: () => client.invalidateQueries({ queryKey: ['saving-goals'] }),
    onError: mutationError('Không thể xóa mục tiêu'),
  });
  /**
   * Open create in the saving goals page interface.
   *
   * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setTarget('');
    setDate(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
    setFormOpen(true);
  };
  /**
   * Open edit in the saving goals page interface.
   *
   * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
   * @param goal - The goal value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setTarget(String(goal.targetAmount));
    setDate(goal.targetDate.slice(0, 10));
    setFormOpen(true);
  };
  /**
   * Open fund in the saving goals page interface.
   *
   * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
   * @param goal - The goal value required by the operation.
   * @param mode - The mode value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
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
    <Screen title="Mục tiêu" bottomNav={false}>
      <PageHero
        heroStyle={{ marginTop: 10, minHeight: 165 }}
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
          <SummaryTile
            label="TỔNG MỤC TIÊU"
            value={String(items.length)}
            icon="target"
          />
          <SummaryTile
            label="ĐÃ TIẾT KIỆM"
            value={money(saved)}
            icon="trending-up"
            color={theme.colors.primaryStrong}
          />
          <SummaryTile
            label="HOÀN THÀNH"
            value={completed + '/' + items.length}
            icon="trophy-outline"
            color={theme.colors.danger}
          />
        </View>
      )}
      <SectionHeading
        style={{ marginTop: -3, marginBottom: -10 }}
        title="Danh sách mục tiêu"
        caption={items.length + ' mục tiêu hiện tại'}
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
      {visibleItems.map((goal, index) => {
        const done = goal.status === 'COMPLETED';
        const green = !done && index % 2 === 1;
        const color = done
          ? '#E7194F'
          : green
            ? theme.colors.success
            : theme.colors.primaryStrong;
        const days = Math.max(
          0,
          Math.ceil((new Date(goal.targetDate).getTime() - today) / 86400000),
        );
        const icon = /laptop/i.test(goal.title)
          ? 'laptop'
          : /xe/i.test(goal.title)
            ? 'bike'
            : /áo/i.test(goal.title)
              ? 'shirt'
              : 'target';
        return (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View
                style={[
                  styles.goalIcon,
                  {
                    backgroundColor: done
                      ? theme.colors.dangerSoft
                      : green
                        ? theme.colors.successSoft
                        : theme.colors.primarySoft,
                  },
                ]}
              >
                <AppIcon name={icon} size={25} color={color} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text
                  style={[
                    styles.goalStatus,
                    {
                      color,
                      backgroundColor: green
                        ? theme.colors.successSoft
                        : theme.colors.primarySoft,
                    },
                  ]}
                >
                  {done
                    ? '◉ HOÀN THÀNH'
                    : goal.status === 'EXPIRED'
                      ? '• QUÁ HẠN'
                      : '● ĐANG TIẾN HÀNH'}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={'Tùy chọn ' + goal.title}
                style={styles.options}
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
                  size={22}
                  color={theme.colors.subtle}
                />
              </Pressable>
            </View>
            {done ? (
              <>
                <View style={styles.completedDate}>
                  <AppIcon
                    name="calendar-blank-outline"
                    size={19}
                    color={color}
                  />
                  <Text style={ui.muted}>
                    Đạt được vào:{' '}
                    <Text style={ui.text}>
                      {new Date(goal.targetDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </Text>
                </View>
                <View style={ui.between}>
                  <Text style={ui.muted}>Tổng cộng:</Text>
                  <Text style={[styles.saved, { color }]}>
                    {money(goal.currentAmount)}
                  </Text>
                </View>
                <ProgressBar value={100} tone="danger" />
                <View style={ui.between}>
                  <Text style={{ color, fontSize: 13 }}>
                    ♧ Đã hoàn thành xuất sắc!
                  </Text>
                  <Text style={{ color, fontSize: 13 }}>100%</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.goalSummary}>
                  <View style={styles.flex}>
                    <Text style={ui.muted}>Mục tiêu tháng</Text>
                    <Text style={styles.summaryValue}>
                      {money(goal.targetAmount)}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={ui.muted}>Còn lại</Text>
                    <Text style={styles.summaryValue}>{days} ngày</Text>
                  </View>
                </View>
                <View style={ui.between}>
                  <Text style={ui.muted}>
                    Đã góp:{' '}
                    <Text style={styles.saved}>
                      {money(goal.currentAmount)}
                    </Text>
                  </Text>
                  <Text style={ui.muted}>
                    Đích đến:{' '}
                    <Text style={ui.text}>{money(goal.targetAmount)}</Text>
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  <ProgressBar value={goal.progress} />
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
                </View>
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
              </>
            )}
          </View>
        );
      })}
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

/**
 * Create theme-aware style definitions for the saving goals page interface.
 *
 * Use it to keep the saving goals page workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    goalCard: {
      padding: 20,
      gap: 18,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 2px 2px rgba(19,27,46,.035)',
    },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    goalIcon: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '500' },
    goalStatus: {
      alignSelf: 'flex-start',
      fontSize: 12,
      fontWeight: '500',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginTop: 8,
    },
    options: {
      width: 32,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '500',
      color: theme.colors.text,
      marginTop: 4,
    },
    completedDate: {
      padding: 12,
      borderRadius: 11,
      backgroundColor: theme.colors.surfaceRaised,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    heroAction: {
      minHeight: 38,
      paddingHorizontal: 14,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.onBrand,
    },
    heroActionText: {
      color: theme.colors.primaryStrong,
      fontSize: 16,
      fontWeight: '700',
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
      fontSize: 20,
      fontWeight: '700',
    },
    progressText: { color: theme.colors.primaryStrong, fontWeight: '700' },
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
