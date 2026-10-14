import { LinearGradient } from 'expo-linear-gradient';
import { money } from '@/components/finance';
import { categoryAppearance } from '@/components/design';
import { Text, TextInput } from '@/components/design-text';
import { useEffect, useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { apiRequest } from '@/lib/api';
import type { Transaction } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';
import { useOfflineStorage } from '@/storage/offline';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Render the transactions page interface.
 *
 * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered transactions page interface.
 */
export default function TransactionsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const offlineStorage = useOfflineStorage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [failedCount, setFailedCount] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  const pageSize = 15;
  const query = useInfiniteQuery({
    queryKey: ['transactions', month, year, search.trim(), type],
    initialPageParam: 0,
    /**
     * Load transactions page data for the query cache.
     *
     * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
     * @param props - The properties that configure this React component.
     * @returns The resulting transactions page value for the caller.
     */
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        skip: String(pageParam),
        take: String(pageSize),
        order: 'desc',
        startDate,
        endDate,
      });
      if (search.trim()) params.set('search', search.trim());
      if (type !== 'ALL') params.set('type', type);
      return apiRequest<{
        transactions: Transaction[];
        pagination: { total: number };
      }>(`/transactions?${params.toString()}`);
    },
    /**
     * Return next page param required by the transactions page workflow.
     *
     * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
     * @param lastPage - The last page value required by the operation.
     * @param pages - The pages value required by the operation.
     * @returns The resulting transactions page value for the caller.
     */
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (sum, page) => sum + page.transactions.length,
        0,
      );
      return loaded < lastPage.pagination.total ? loaded : undefined;
    },
  });
  const report = useQuery({
    queryKey: ['monthly-report', month, year],
    /**
     * Load transactions page data for the query cache.
     *
     * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting transactions page value for the caller.
     */
    queryFn: () =>
      apiRequest<{ summary: { totalExpense: number } }>(
        `/transactions/report?month=${month}&year=${year}`,
      ),
  });
  /**
   * Move the selected transactions page period backward.
   *
   * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const previousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((value) => value - 1);
    } else setMonth((value) => value - 1);
  };
  /**
   * Move the selected transactions page period forward.
   *
   * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((value) => value + 1);
    } else setMonth((value) => value + 1);
  };
  const remove = useMutation({
    /**
     * Execute the transactions page mutation requested by the client.
     *
     * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
     * @param item - The item value required by the operation.
     * @returns The resulting transactions page value for the caller.
     */
    mutationFn: (item: Transaction) =>
      apiRequest(`/transactions/${item.id}?version=${item.version}`, {
        method: 'DELETE',
      }),
    /**
     * Finalize the transactions page workflow after a successful operation.
     *
     * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
     * @returns A promise that resolves after the operation completes.
     */
    onSuccess: async () => {
      await Promise.all(
        [
          ['transactions'],
          ['wallets'],
          ['dashboard'],
          ['monthly-report'],
          ['monthly-trend'],
          ['year-report'],
          ['budgets'],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
    /**
     * Map a failed transactions page operation into user-visible state.
     *
     * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
     * @param error - The failure value to classify, report, or propagate.
     * @returns The resulting transactions page value for the caller.
     */
    onError: (error) =>
      Alert.alert(
        'Không thể xóa',
        error instanceof Error ? error.message : 'Vui lòng tải lại và thử lại',
      ),
  });
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void offlineStorage.getFailedCount(userId).then((count) => {
      if (active) setFailedCount(count);
    });
    return () => {
      active = false;
    };
  }, [offlineStorage, query.dataUpdatedAt, userId]);
  const monthItems = (
    query.data?.pages.flatMap((page) => page.transactions) || []
  ).filter((item) => item.type !== 'TRANSFER');
  const total = query.data?.pages[0]?.pagination.total || 0;
  const filtered = monthItems;
  const monthTotal = -Number(report.data?.summary.totalExpense || 0);
  return (
    <Screen title="Giao dịch" bottomNav={false}>
      <LinearGradient
        colors={theme.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.transactionHero}
      >
        <View style={styles.heroTop}>
          <Pressable
            style={styles.monthChip}
            onPress={() =>
              Alert.alert('Chọn tháng', undefined, [
                { text: 'Tháng trước', onPress: previousMonth },
                { text: 'Tháng sau', onPress: nextMonth },
                { text: 'Hủy', style: 'cancel' },
              ])
            }
          >
            <AppIcon name="calendar-blank-outline" size={15} color="#FFFFFF" />
            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>
              Tháng {month}/{year}
            </Text>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>
              TỔNG CHI THÁNG
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '600',
                marginTop: 3,
              }}
            >
              {money(monthTotal)}
            </Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Giao dịch</Text>
        <Text style={styles.heroSubtitle}>
          Thu chi tháng {month}/{year} • Tổng {total} hoạt động
        </Text>
        <View style={styles.heroButtons}>
          <Link href="/scan-receipt" asChild>
            <Pressable style={styles.scanButton}>
              <View style={styles.scanIcon}>
                <AppIcon name="line-scan" size={17} color="#FFFFFF" />
              </View>
              <Text
                style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}
              >
                Quét hóa đơn
              </Text>
            </Pressable>
          </Link>
          <Link href="/add-transaction" asChild>
            <Pressable style={styles.addButton}>
              <AppIcon
                name="plus-circle-outline"
                size={19}
                color={theme.colors.primaryStrong}
              />
              <Text
                style={{
                  color: theme.colors.primaryStrong,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                Thêm giao dịch
              </Text>
            </Pressable>
          </Link>
        </View>
      </LinearGradient>
      <View style={styles.searchBox}>
        <AppIcon name="magnify" size={20} color={theme.colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm kiếm ghi chú, nguồn nhận, số tiền…"
          placeholderTextColor={theme.colors.muted}
          style={styles.searchInput}
        />
        <AppIcon name="tune-variant" size={18} color={theme.colors.muted} />
      </View>
      <View style={styles.filters}>
        {[
          { label: 'Tất cả (' + total + ')', value: 'ALL' },
          { label: 'Chi tiêu', value: 'EXPENSE' },
          { label: 'Thu nhập', value: 'INCOME' },
        ].map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setType(item.value)}
            style={[
              styles.filterChip,
              type === item.value && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                color:
                  type === item.value ? '#FFFFFF' : theme.colors.primaryStrong,
                fontWeight: type === item.value ? '500' : '400',
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={styles.filterChip}
          onPress={() =>
            Alert.alert('Chọn thời gian', undefined, [
              { text: 'Tháng trước', onPress: previousMonth },
              { text: 'Tháng sau', onPress: nextMonth },
              { text: 'Hủy', style: 'cancel' },
            ])
          }
        >
          <Text style={{ fontSize: 13, color: theme.colors.primaryStrong }}>
            Thời gian⌄
          </Text>
        </Pressable>
      </View>
      {failedCount > 0 && (
        <Card>
          <Text style={ui.negative}>
            {failedCount} thay đổi chưa đồng bộ. Kiểm tra kết nối trước khi sửa
            tiếp.
          </Text>
        </Card>
      )}
      {query.isLoading && (
        <StateMessage loading message="Đang tải giao dịch…" />
      )}
      {query.isError && <StateMessage message="Không thể tải giao dịch." />}
      {!query.isLoading && !filtered.length && (
        <EmptyState
          icon="receipt-text-outline"
          title="Không có giao dịch"
          message={
            search || type !== 'ALL'
              ? 'Không có kết quả phù hợp bộ lọc.'
              : 'Thêm giao dịch đầu tiên để bắt đầu theo dõi.'
          }
        />
      )}
      {filtered.map((item, index) => {
        const day = new Date(item.transactionDate).toLocaleDateString('vi-VN');
        const firstInDay =
          index === 0 ||
          new Date(filtered[index - 1].transactionDate).toLocaleDateString(
            'vi-VN',
          ) !== day;
        const dayTotal = filtered
          .filter(
            (t) =>
              new Date(t.transactionDate).toLocaleDateString('vi-VN') === day,
          )
          .reduce(
            (sum, t) => sum + (t.type === 'INCOME' ? 1 : -1) * Number(t.amount),
            0,
          );
        const appearance = categoryAppearance(item.category?.name);
        const income = item.type === 'INCOME';
        /**
         * Edit for transactions page.
         *
         * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
         * @returns The resulting transactions page value for the caller.
         */
        const edit = () =>
          router.push({
            pathname: '/add-transaction',
            params: { id: item.id },
          });
        /**
         * Confirm delete for transactions page.
         *
         * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
         * @returns The resulting transactions page value for the caller.
         */
        const confirmDelete = () =>
          Alert.alert(
            'Xóa giao dịch?',
            item.type === 'EXPENSE'
              ? 'Giao dịch chi sẽ bị xóa; số tiền trong ví không thay đổi.'
              : 'Số tiền đã thu sẽ được trừ khỏi ví.',
            [
              { text: 'Hủy' },
              {
                text: 'Xóa',
                style: 'destructive',
                /**
                 * Handle press for the transactions page workflow.
                 *
                 * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
                 * @returns The resulting transactions page value for the caller.
                 */
                onPress: () => remove.mutate(item),
              },
            ],
          );
        return (
          <View key={item.id} style={{ gap: 12 }}>
            {firstInDay && (
              <View style={styles.dayHeading}>
                <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
                  <Text
                    style={{
                      color: theme.colors.primaryStrong,
                      fontWeight: '500',
                    }}
                  >
                    •{' '}
                    {day === new Date().toLocaleDateString('vi-VN')
                      ? 'Hôm nay'
                      : day}
                  </Text>
                  {' ' +
                    new Date(item.transactionDate).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                    })}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color:
                      dayTotal >= 0
                        ? theme.colors.success
                        : theme.colors.danger,
                  }}
                >
                  {dayTotal >= 0 ? '+' : ''}
                  {money(dayTotal)}
                </Text>
              </View>
            )}
            <Pressable
              onPress={edit}
              onLongPress={confirmDelete}
              style={styles.transaction}
            >
              <View
                style={[
                  styles.transactionIcon,
                  {
                    backgroundColor: income
                      ? theme.colors.successSoft
                      : appearance.soft,
                  },
                ]}
              >
                <AppIcon
                  name={income ? 'cash-plus' : appearance.icon}
                  size={20}
                  color={income ? theme.colors.successStrong : appearance.color}
                />
              </View>
              <View style={styles.transactionBody}>
                <Text numberOfLines={1} style={styles.transactionTitle}>
                  {item.category?.name || 'Giao dịch'}
                </Text>
                <Text numberOfLines={1} style={styles.transactionMeta}>
                  Ví: {item.wallet?.name || 'Ví'} ·{' '}
                  {new Date(item.transactionDate).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    income ? ui.positive : ui.negative,
                  ]}
                >
                  {income ? '+' : '-'}
                  {Number(item.amount).toLocaleString('vi-VN')} ₫
                </Text>
                <View style={styles.miniActions}>
                  <Pressable
                    accessibilityLabel="Chỉnh sửa giao dịch"
                    onPress={edit}
                    style={styles.miniButton}
                  >
                    <AppIcon
                      name="pencil-outline"
                      size={14}
                      color={theme.colors.muted}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Xóa giao dịch"
                    onPress={confirmDelete}
                    style={styles.miniButton}
                  >
                    <AppIcon
                      name="trash-can-outline"
                      size={14}
                      color={theme.colors.muted}
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        );
      })}
      {!!filtered.length && (
        <Card>
          <Text style={[ui.muted, { textAlign: 'center' }]}>
            Hiển thị {filtered.length}/{total} giao dịch
          </Text>
          {query.hasNextPage && (
            <Button
              variant="secondary"
              label="Tải thêm giao dịch"
              loading={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
            />
          )}
        </Card>
      )}
    </Screen>
  );
}

/**
 * Create theme-aware style definitions for the transactions page interface.
 *
 * Use it to keep the transactions page workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    transactionHero: { padding: 20, borderRadius: 16, minHeight: 238 },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    monthChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,.15)',
    },
    heroTitle: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '600',
      marginTop: 4,
    },
    heroSubtitle: { color: '#DCE6FF', fontSize: 13, marginTop: 4 },
    heroButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
    scanButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: 'rgba(255,255,255,.2)',
    },
    scanIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#68F6BC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#FFFFFF',
    },
    filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.neutralSoft,
    },
    dayHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    period: {
      minHeight: 58,
      paddingHorizontal: 20,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    periodText: { color: theme.colors.text, fontSize: 17, fontWeight: '900' },
    searchBox: {
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontSize: 13 },
    transaction: {
      minHeight: 88,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 2px 2px rgba(19,27,46,.035)',
    },
    transactionIcon: {
      width: 42,
      height: 42,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transactionBody: { flex: 1, minWidth: 0 },
    transactionTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    transactionMeta: { marginTop: 3, color: theme.colors.muted, fontSize: 12 },
    transactionRight: { alignItems: 'flex-end', gap: 5 },
    transactionAmount: { fontSize: 17, fontWeight: '900' },
    miniActions: { flexDirection: 'row', gap: 5 },
    miniButton: {
      width: 26,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceRaised,
    },
  });
