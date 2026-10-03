import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Badge,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  MetricCard,
  Screen,
  SectionTitle,
  Sheet,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { ActionLink, EntityCard, IconTile, money } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import type { Category, Wallet } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

interface Recurring {
  id: string;
  walletId?: string;
  categoryId?: string;
  amount: string | number;
  type: 'INCOME' | 'EXPENSE';
  frequency: string;
  note?: string;
  startDate: string;
  isActive: boolean;
  nextExecutionDate: string;
  wallet: Wallet;
  category: Category;
}

export default function RecurringPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [type, setType] = useState('EXPENSE');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const query = useQuery({
    queryKey: ['recurring'],
    queryFn: () => apiRequest<Recurring[]>('/recurring-transactions'),
  });
  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiRequest<Wallet[]>('/wallets'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories'),
  });
  const mutationError = (title: string) => (error: Error) =>
    Alert.alert(title, error.message || 'Vui lòng thử lại.');
  const save = useMutation({
    mutationFn: () =>
      apiRequest(
        editing
          ? `/recurring-transactions/${editing.id}`
          : '/recurring-transactions',
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify({
            walletId,
            categoryId,
            amount: Number(amount),
            type,
            frequency,
            note,
            startDate: new Date(`${startDate}T12:00:00`).toISOString(),
          }),
        },
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['recurring'] });
      setOpen(false);
      setEditing(null);
    },
    onError: mutationError('Không thể lưu giao dịch định kỳ'),
  });
  const toggle = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/recurring-transactions/${id}/toggle`, { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['recurring'] }),
    onError: mutationError('Không thể đổi trạng thái'),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/recurring-transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['recurring'] }),
    onError: mutationError('Không thể xóa giao dịch định kỳ'),
  });
  const filteredCategories =
    categories.data?.filter((item) => item.type === type) || [];
  const items = query.data || [];
  const active = items.filter((item) => item.isActive);
  const income = active
    .filter((item) => item.type === 'INCOME')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = active
    .filter((item) => item.type === 'EXPENSE')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const visibleItems = items.filter((item) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      `${item.note || ''} ${item.category?.name || ''} ${item.wallet?.name || ''}`
        .toLowerCase()
        .includes(keyword);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' ? item.isActive : !item.isActive);
    return matchesSearch && matchesStatus;
  });
  const start = (item?: Recurring) => {
    setEditing(item || null);
    setType(item?.type || 'EXPENSE');
    setFrequency(item?.frequency || 'MONTHLY');
    setAmount(item ? String(item.amount) : '');
    setNote(item?.note || '');
    setStartDate(
      item?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    );
    setWalletId(
      item?.walletId || item?.wallet?.id || wallets.data?.[0]?.id || '',
    );
    setCategoryId(item?.categoryId || item?.category?.id || '');
    setOpen(true);
  };
  const frequencyLabel = (value: string) =>
    ({
      DAILY: 'Hàng ngày',
      WEEKLY: 'Hàng tuần',
      MONTHLY: 'Hàng tháng',
      YEARLY: 'Hàng năm',
    })[value] || value;

  return (
    <Screen title="Định kỳ">
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recurringHero}
      >
        <View style={styles.smartBadge}>
          <AppIcon name="link-variant" size={17} color={theme.colors.onBrand} />
          <Text style={styles.smartBadgeText}>MONEYMATE SMART</Text>
        </View>
        <Text style={styles.heroTitle}>Giao dịch định kỳ</Text>
        <Text style={styles.heroSubtitle}>
          Tự động hóa các khoản chi thu, nhắc lịch{`\n`}thông minh và quản lý
          chu kỳ ví.
        </Text>
        <Pressable style={styles.heroAction} onPress={() => start()}>
          <AppIcon
            name="plus-circle-outline"
            size={22}
            color={theme.colors.primaryStrong}
          />
          <Text style={styles.heroActionText}>Thêm định kỳ</Text>
        </Pressable>
        <AppIcon
          name="sync"
          size={78}
          color="rgba(255,255,255,.16)"
          style={styles.heroDecoration}
        />
      </LinearGradient>
      {!!items.length && (
        <View style={styles.metrics}>
          <MetricCard
            label="Tổng số"
            value={String(items.length)}
            icon="swap-horizontal"
            caption={`${items.length - active.length} tắt · ${active.length} bật`}
          />
          <MetricCard
            label="Thu nhập"
            value={money(income)}
            icon="arrow-bottom-left"
            tone="success"
            caption={`${active.filter((item) => item.type === 'INCOME').length} lịch thu`}
          />
          <MetricCard
            label="Chi tiêu"
            value={money(expense)}
            icon="arrow-top-right"
            tone="danger"
            caption={`${active.filter((item) => item.type === 'EXPENSE').length} lịch chi`}
          />
        </View>
      )}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <AppIcon name="magnify" size={22} color={theme.colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm giao dịch định kỳ…"
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
          />
        </View>
        <Pressable
          accessibilityLabel="Lọc giao dịch định kỳ"
          style={styles.filterButton}
          onPress={() =>
            Alert.alert('Lọc theo trạng thái', undefined, [
              { text: 'Tất cả', onPress: () => setStatusFilter('ALL') },
              { text: 'Hoạt động', onPress: () => setStatusFilter('ACTIVE') },
              { text: 'Tạm dừng', onPress: () => setStatusFilter('PAUSED') },
              { text: 'Hủy', style: 'cancel' },
            ])
          }
        >
          <AppIcon
            name="filter-variant"
            size={22}
            color={theme.colors.primaryStrong}
          />
        </Pressable>
      </View>
      <SectionTitle
        title="Danh sách chu kỳ"
        caption={`${visibleItems.length} mục`}
      />
      {query.isLoading && (
        <StateMessage loading message="Đang tải lịch định kỳ…" />
      )}
      {query.isError && (
        <StateMessage message="Không thể tải giao dịch định kỳ." />
      )}
      {!query.isLoading && !query.isError && !items.length && (
        <EmptyState
          icon="calendar-sync-outline"
          title="Chưa có giao dịch định kỳ"
          message="Tạo lịch để MoneyMate tự ghi nhận đúng hạn."
          action={
            <Button label="Thêm giao dịch định kỳ" onPress={() => start()} />
          }
        />
      )}
      {visibleItems.map((item) => (
        <EntityCard
          key={item.id}
          icon={
            <IconTile
              name={
                (item.category?.icon as AppIconName) || 'calendar-sync-outline'
              }
              color={item.isActive ? theme.colors.primary : theme.colors.muted}
              background={
                item.isActive
                  ? theme.colors.successSoft
                  : theme.colors.neutralSoft
              }
            />
          }
          title={item.note || item.category?.name || 'Giao dịch định kỳ'}
          subtitle={`Danh mục: ${item.category?.name || 'Chưa phân loại'}`}
          value={`${item.type === 'EXPENSE' ? '-' : '+'}${money(item.amount)}`}
          badge={
            <Badge
              label={item.isActive ? 'Hoạt động' : 'Tạm dừng'}
              tone={item.isActive ? 'success' : 'neutral'}
            />
          }
        >
          <View style={styles.schedule}>
            <View style={styles.scheduleInfo}>
              <AppIcon
                name="clock-outline"
                size={16}
                color={theme.colors.muted}
              />
              <Text style={ui.muted}>{frequencyLabel(item.frequency)}</Text>
              <AppIcon
                name="wallet-outline"
                size={16}
                color={theme.colors.muted}
              />
              <Text numberOfLines={1} style={[ui.muted, styles.walletName]}>
                {item.wallet?.name}
              </Text>
            </View>
            <Badge
              label={new Date(item.nextExecutionDate).toLocaleDateString(
                'vi-VN',
              )}
              tone={item.isActive ? 'success' : 'info'}
            />
          </View>
          <View style={ui.between}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.isActive
                      ? theme.colors.success
                      : theme.colors.subtle,
                  },
                ]}
              />
              <Text style={item.isActive ? ui.positive : ui.muted}>
                {item.isActive ? 'Chu kỳ tự động kế tiếp' : 'Đã tạm dừng'}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <ActionLink
                label={item.isActive ? 'Dừng' : 'Bật'}
                icon={
                  item.isActive ? 'pause-circle-outline' : 'play-circle-outline'
                }
                onPress={() => toggle.mutate(item.id)}
              />
              <ActionLink
                label="Sửa"
                icon="pencil-outline"
                onPress={() => start(item)}
              />
              <ActionLink
                danger
                label="Xóa"
                icon="trash-can-outline"
                onPress={() =>
                  Alert.alert('Xóa lịch định kỳ?', undefined, [
                    { text: 'Hủy' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => remove.mutate(item.id),
                    },
                  ])
                }
              />
            </View>
          </View>
        </EntityCard>
      ))}
      <Pressable style={styles.addRecurring} onPress={() => start()}>
        <AppIcon name="plus" size={22} color={theme.colors.primaryStrong} />
        <Text style={styles.addRecurringText}>Thêm giao dịch định kỳ mới</Text>
      </Pressable>
      <Sheet
        visible={open}
        title={editing ? 'Sửa giao dịch định kỳ' : 'Tạo giao dịch định kỳ'}
        onClose={() => setOpen(false)}
      >
        <Text style={ui.muted}>Loại giao dịch</Text>
        <ChoiceChips
          value={type}
          options={[
            { label: 'Khoản chi', value: 'EXPENSE' },
            { label: 'Khoản thu', value: 'INCOME' },
          ]}
          onChange={(value) => {
            setType(value);
            setCategoryId('');
          }}
        />
        <Text style={ui.muted}>Chu kỳ</Text>
        <ChoiceChips
          value={frequency}
          options={[
            { label: 'Hàng ngày', value: 'DAILY' },
            { label: 'Hàng tuần', value: 'WEEKLY' },
            { label: 'Hàng tháng', value: 'MONTHLY' },
            { label: 'Hàng năm', value: 'YEARLY' },
          ]}
          onChange={setFrequency}
        />
        <Text style={ui.muted}>Ví</Text>
        <ChoiceChips
          value={walletId}
          options={(wallets.data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          onChange={setWalletId}
        />
        <Text style={ui.muted}>Danh mục</Text>
        <ChoiceChips
          value={categoryId}
          options={filteredCategories.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          onChange={setCategoryId}
        />
        <Field
          label="Số tiền"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Field
          label="Ngày bắt đầu (YYYY-MM-DD)"
          value={startDate}
          onChangeText={setStartDate}
        />
        <Field label="Ghi chú" value={note} onChangeText={setNote} />
        <Button
          label={editing ? 'Lưu thay đổi' : 'Tạo lịch'}
          loading={save.isPending}
          disabled={
            !walletId || !categoryId || Number(amount) <= 0 || !startDate
          }
          onPress={() => save.mutate()}
        />
      </Sheet>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    recurringHero: {
      minHeight: 248,
      padding: 30,
      borderRadius: 17,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.24,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 7 },
      elevation: 5,
    },
    smartBadge: {
      alignSelf: 'flex-start',
      minHeight: 24,
      paddingHorizontal: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,.15)',
    },
    smartBadgeText: {
      color: theme.colors.onBrand,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.3,
    },
    heroTitle: {
      marginTop: 10,
      color: theme.colors.onBrand,
      fontSize: 30,
      lineHeight: 35,
      fontWeight: '900',
      letterSpacing: -0.7,
    },
    heroSubtitle: {
      marginTop: 2,
      color: 'rgba(255,255,255,.88)',
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
    },
    heroAction: {
      alignSelf: 'flex-start',
      minHeight: 56,
      marginTop: 18,
      paddingHorizontal: 20,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.onBrand,
    },
    heroActionText: {
      color: theme.colors.primaryStrong,
      fontSize: 17,
      fontWeight: '900',
    },
    heroDecoration: { position: 'absolute', right: 22, bottom: 17 },
    metrics: { flexDirection: 'row', gap: 8 },
    sort: { color: theme.colors.primaryStrong, fontWeight: '800' },
    searchRow: { flexDirection: 'row', gap: 8 },
    searchBox: {
      flex: 1,
      height: 54,
      paddingHorizontal: 16,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontSize: 15 },
    filterButton: {
      width: 58,
      height: 54,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    schedule: {
      minHeight: 43,
      paddingHorizontal: 11,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      backgroundColor: theme.colors.surfaceRaised,
    },
    scheduleInfo: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    walletName: { flex: 1 },
    statusRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    itemActions: { flexDirection: 'row' },
    addRecurring: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 17,
      backgroundColor: theme.colors.primarySoft,
    },
    addRecurringText: {
      color: theme.colors.primaryStrong,
      fontSize: 16,
      fontWeight: '900',
    },
  });
