import { useEffect, useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppIcon } from '@/components/app-icon';
import {
  Button,
  Card,
  ChoiceChips,
  EmptyState,
  PageHero,
  Screen,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { apiRequest } from '@/lib/api';
import type { Transaction } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';
import { useOfflineStorage } from '@/storage/offline';
import { useAuthStore } from '@/stores/auth.store';

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
    queryFn: () =>
      apiRequest<{ summary: { totalExpense: number } }>(
        `/transactions/report?month=${month}&year=${year}`,
      ),
  });
  const previousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((value) => value - 1);
    } else setMonth((value) => value - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((value) => value + 1);
    } else setMonth((value) => value + 1);
  };
  const remove = useMutation({
    mutationFn: (item: Transaction) =>
      apiRequest(`/transactions/${item.id}?version=${item.version}`, {
        method: 'DELETE',
      }),
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
    <Screen title="Giao dịch">
      <PageHero
        eyebrow={`THÁNG ${month}/${year}`}
        title="Giao dịch"
        subtitle={`${total} giao dịch trong kỳ`}
        icon="receipt-text-outline"
      >
        <View
          style={{
            marginTop: 15,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              color: theme.colors.onBrand,
              fontSize: 13,
              fontWeight: '800',
            }}
          >
            TỔNG CHI THÁNG
          </Text>
          <Text
            style={{
              color: theme.colors.onBrand,
              fontSize: 22,
              fontWeight: '900',
            }}
          >
            {monthTotal.toLocaleString('vi-VN')} ₫
          </Text>
        </View>
        <View style={{ marginTop: 14, flexDirection: 'row', gap: 9 }}>
          <Link href="/scan-receipt" asChild>
            <Pressable
              style={{
                flex: 1,
                minHeight: 43,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,.18)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <AppIcon
                name="line-scan"
                size={20}
                color={theme.colors.onBrand}
              />
              <Text style={{ color: theme.colors.onBrand, fontWeight: '900' }}>
                Quét hóa đơn
              </Text>
            </Pressable>
          </Link>
          <Link href="/add-transaction" asChild>
            <Pressable
              style={{
                flex: 1,
                minHeight: 43,
                borderRadius: 12,
                backgroundColor: theme.colors.onBrand,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <AppIcon
                name="plus-circle-outline"
                size={20}
                color={theme.colors.primaryStrong}
              />
              <Text
                style={{ color: theme.colors.primaryStrong, fontWeight: '900' }}
              >
                Thêm giao dịch
              </Text>
            </Pressable>
          </Link>
        </View>
      </PageHero>
      <View style={styles.period}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng trước"
          onPress={previousMonth}
        >
          <AppIcon name="chevron-left" size={27} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.periodText}>
          Tháng {month}/{year}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng sau"
          onPress={nextMonth}
        >
          <AppIcon
            name="chevron-right"
            size={27}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>
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
      <ChoiceChips
        value={type}
        options={[
          { label: `Tất cả (${total})`, value: 'ALL' },
          { label: 'Chi tiêu', value: 'EXPENSE' },
          { label: 'Thu nhập', value: 'INCOME' },
        ]}
        onChange={setType}
      />
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
      {filtered.map((item) => {
        const income = item.type === 'INCOME';
        const edit = () =>
          router.push({
            pathname: '/add-transaction',
            params: { id: item.id },
          });
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
                onPress: () => remove.mutate(item),
              },
            ],
          );
        return (
          <Pressable
            key={item.id}
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
                    : theme.colors.dangerSoft,
                },
              ]}
            >
              <AppIcon
                name={income ? 'cash-plus' : 'shopping-outline'}
                size={20}
                color={
                  income ? theme.colors.successStrong : theme.colors.danger
                }
              />
            </View>
            <View style={styles.transactionBody}>
              <Text numberOfLines={1} style={styles.transactionTitle}>
                {item.category?.name || 'Giao dịch'}
              </Text>
              <Text numberOfLines={1} style={styles.transactionMeta}>
                {item.wallet?.name || 'Ví'} ·{' '}
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
      minHeight: 74,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      fontSize: 14,
      fontWeight: '800',
    },
    transactionMeta: { marginTop: 3, color: theme.colors.muted, fontSize: 10 },
    transactionRight: { alignItems: 'flex-end', gap: 5 },
    transactionAmount: { fontSize: 13, fontWeight: '900' },
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
