import { LinearGradient } from 'expo-linear-gradient';
import { Ring, categoryAppearance } from '@/components/design';
import { Text } from '@/components/design-text';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { Screen, StateMessage } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Dashboard } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

type Report = {
  categoryExpenses?: {
    id: string;
    name: string;
    amount: number;
    color?: string;
  }[];
};
type Trend = {
  label?: string;
  month?: number;
  income: number;
  expense: number;
};
type Insight = { insights?: { title: string; message: string }[] };
type DashboardStyles = ReturnType<typeof createStyles>;
/**
 * Format a monetary amount for display in Vietnamese dong.
 *
 * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
 * @param value - The value to transform or evaluate.
 * @returns The resulting dashboard page value for the caller.
 */
const money = (value: number | string = 0) =>
  `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`;
const months = [
  'T1',
  'T2',
  'T3',
  'T4',
  'T5',
  'T6',
  'T7',
  'T8',
  'T9',
  'T10',
  'T11',
  'T12',
];

/**
 * Render the dashboard page interface.
 *
 * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered dashboard page interface.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const now = new Date();
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    /**
     * Load dashboard page data for the query cache.
     *
     * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting dashboard page value for the caller.
     */
    queryFn: () => apiRequest<Dashboard>('/transactions/dashboard'),
  });
  const report = useQuery({
    queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()],
    /**
     * Load dashboard page data for the query cache.
     *
     * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting dashboard page value for the caller.
     */
    queryFn: () =>
      apiRequest<Report>(
        `/transactions/report?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      ),
  });
  const trend = useQuery({
    queryKey: ['monthly-trend', 6],
    /**
     * Load dashboard page data for the query cache.
     *
     * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting dashboard page value for the caller.
     */
    queryFn: () => apiRequest<Trend[]>('/transactions/trend?months=6'),
  });
  const insight = useQuery({
    queryKey: ['ai-analysis-dash'],
    /**
     * Load dashboard page data for the query cache.
     *
     * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting dashboard page value for the caller.
     */
    queryFn: () => apiRequest<Insight>('/ai/analyze/expenses'),
  });
  /**
   * Refresh dashboard page used by the dashboard page workflow.
   *
   * Use it to keep the dashboard page workflow's presentation and interactions in one reusable UI boundary.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const refresh = () => {
    void dashboard.refetch();
    void report.refetch();
    void trend.refetch();
    void insight.refetch();
  };
  const data = dashboard.data;
  const topInsight = insight.data?.insights?.[0];
  const categories = report.data?.categoryExpenses || [];
  const barData = (trend.data || []).map((item) => ({
    label: item.label || (item.month ? months[item.month - 1] : ''),
    income: item.income,
    expense: item.expense,
  }));

  const totalExpenses = categories.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const previous = barData.at(-2);
  const change = (current: number, past?: number) =>
    past ? ((current - past) / past) * 100 : null;
  const incomeChange = change(data?.monthlyIncome || 0, previous?.income);
  const expenseChange = change(data?.monthlyExpense || 0, previous?.expense);
  const savingsRate = data?.monthlyIncome
    ? Math.round(
        (Number(data.monthlySavings) / Number(data.monthlyIncome)) * 1000,
      ) / 10
    : 0;
  const palette = ['#004DCE', '#68F6BC', '#D51A4C', '#B6C3FF'];
  return (
    <Screen
      title="Tổng quan"
      refreshing={dashboard.isRefetching}
      onRefresh={refresh}
    >
      {dashboard.isLoading && (
        <StateMessage loading message="Đang tải tổng quan tài chính…" />
      )}
      {dashboard.isError && (
        <StateMessage message="Không thể tải tổng quan. Kéo xuống để thử lại." />
      )}
      {data && (
        <>
          <LinearGradient
            colors={theme.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.flex}>
                <Text style={styles.greeting}>
                  Xin chào, {user?.fullName?.split(' ').pop() || 'bạn'} 👋
                </Text>
                <Text style={styles.report}>
                  Báo cáo thông minh cho tháng{'\n'}
                  {now.getMonth() + 1}/{now.getFullYear()}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.addButton}
                onPress={() => router.push('/add-transaction' as Href)}
              >
                <AppIcon name="plus" size={21} color="#FFFFFF" />
                <Text style={styles.addText}>Thêm{'\n'}nhanh</Text>
              </Pressable>
            </View>
            <Text style={styles.balanceLabel}>TỔNG SỐ DƯ KHẢ DỤNG</Text>
            <View style={styles.balanceRow}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.balance,
                  {
                    fontSize: Math.min(
                      40,
                      Math.max(
                        24,
                        Math.floor(
                          (width - 119) / (money(data.netWorth).length * 0.68),
                        ),
                      ),
                    ),
                  },
                ]}
              >
                {money(data.netWorth)}
              </Text>
              <View style={styles.balanceDot} />
            </View>
          </LinearGradient>
          <Pressable
            style={styles.insight}
            onPress={() => router.push('/(tabs)/advisor' as Href)}
          >
            <View style={styles.aiIcon}>
              <AppIcon name="creation" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.aiBadge}>AI ADVISOR •</Text>
              <Text numberOfLines={1} style={styles.insightMessage}>
                {topInsight
                  ? topInsight.message
                  : categories[0]
                    ? 'Chi nhiều nhất: ' + categories[0].name
                    : 'Xem phân tích tài chính của bạn'}
              </Text>
            </View>
            <AppIcon
              name="chevron-right"
              size={22}
              color={theme.colors.subtle}
            />
          </Pressable>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              Tổng quan tháng {now.getMonth() + 1}
            </Text>
            <Text style={styles.sectionLink}>Thu & Chi</Text>
          </View>
          <View style={styles.stats}>
            <Stat
              styles={styles}
              title="Tổng thu nhập"
              value={money(data.monthlyIncome)}
              hint={
                incomeChange === null
                  ? 'Thu nhập tháng này'
                  : (incomeChange! >= 0 ? '↑ +' : '↓ ') +
                    incomeChange!.toFixed(1) +
                    '% so với T' +
                    (now.getMonth() || 12)
              }
              icon="wallet-outline"
              color={theme.colors.success}
              background="#C3FBE5"
            />
            <Stat
              styles={styles}
              title="Tổng chi tiêu"
              value={money(data.monthlyExpense)}
              hint={
                expenseChange === null
                  ? 'Chi tiêu tháng này'
                  : (expenseChange! >= 0 ? '↑ +' : '↓ ') +
                    expenseChange!.toFixed(1) +
                    '% so với T' +
                    (now.getMonth() || 12)
              }
              icon="trending-down"
              color={theme.colors.danger}
              background="#FFDADD"
            />
            <Stat
              styles={styles}
              title="Tiết kiệm tháng này"
              value={money(data.monthlySavings)}
              hint={'↗ ' + savingsRate + '% tỷ lệ tiết kiệm'}
              icon="piggy-bank-outline"
              color={theme.colors.primaryStrong}
              background={theme.colors.primarySoft}
            />
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Chi tiêu theo danh mục</Text>
                <Text style={styles.cardSubtitle}>
                  Phân bổ dòng tiền tháng {now.getMonth() + 1}
                </Text>
              </View>
              <View style={styles.cardIcon}>
                <AppIcon
                  name="chart-donut"
                  size={22}
                  color={theme.colors.muted}
                />
              </View>
            </View>
            <View style={styles.categoryBody}>
              <Ring
                segments={categories.map((item, i) => ({
                  value: totalExpenses
                    ? Number(item.amount) / totalExpenses
                    : 0,
                  color: palette[i % palette.length],
                }))}
              >
                <Text style={styles.donutPercent}>
                  {totalExpenses
                    ? Math.round(
                        (Number(categories[0]?.amount || 0) / totalExpenses) *
                          100,
                      )
                    : 0}
                  %
                </Text>
                <Text style={styles.donutLabel}>Top 1</Text>
              </Ring>
              <View style={styles.legend}>
                {categories.slice(0, 4).map((item, i) => (
                  <View key={item.id} style={styles.legendRow}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: palette[i % palette.length] },
                      ]}
                    />
                    <Text numberOfLines={1} style={styles.legendName}>
                      {item.name}
                    </Text>
                    <View>
                      <Text style={styles.legendValue}>
                        {money(item.amount)}
                      </Text>
                      <Text style={styles.legendPercent}>
                        {totalExpenses
                          ? Math.round(
                              (Number(item.amount) / totalExpenses) * 100,
                            )
                          : 0}
                        %
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Xu hướng 6 tháng</Text>
                <Text style={styles.cardSubtitle}>
                  Thu nhập vs Chi tiêu{' '}
                  {barData.length
                    ? '(' +
                      barData[0].label +
                      ' – ' +
                      barData.at(-1)?.label +
                      ')'
                    : ''}
                </Text>
              </View>
              <View style={styles.chartLegend}>
                <Text style={{ color: theme.colors.success, fontSize: 13 }}>
                  ● Thu
                </Text>
                <Text style={{ color: theme.colors.danger, fontSize: 13 }}>
                  ● Chi
                </Text>
              </View>
            </View>
            {barData.length ? (
              <BarChart data={barData} highlightLast />
            ) : (
              <StateMessage message="Chưa có dữ liệu xu hướng." />
            )}
          </View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/transactions' as Href)}
            >
              <Text style={styles.sectionLink}>Xem tất cả →</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            {!data.recentTransactions.length && (
              <StateMessage message="Chưa có giao dịch." />
            )}
            {data.recentTransactions
              .filter((item) => item.type !== 'TRANSFER')
              .slice(0, 3)
              .map((item) => {
                const income = item.type === 'INCOME';
                const appearance = categoryAppearance(item.category?.name);
                return (
                  <Pressable
                    key={item.id}
                    style={styles.transaction}
                    onPress={() =>
                      router.push({
                        pathname: '/add-transaction',
                        params: { id: item.id },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: income ? '#AFF8DC' : appearance.soft,
                        },
                      ]}
                    >
                      <AppIcon
                        name={income ? 'cash-multiple' : appearance.icon}
                        size={24}
                        color={
                          income
                            ? theme.colors.success
                            : theme.colors.primaryStrong
                        }
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text numberOfLines={1} style={styles.transactionName}>
                        {item.note || item.category?.name || 'Giao dịch'}
                      </Text>
                      <Text numberOfLines={1} style={styles.transactionMeta}>
                        {new Date(item.transactionDate).toLocaleDateString(
                          'vi-VN',
                        )}{' '}
                        • {item.category?.name}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color: income
                              ? theme.colors.success
                              : theme.colors.danger,
                          },
                        ]}
                      >
                        {income ? '+' : '−'}
                        {money(item.amount)}
                      </Text>
                      <Text
                        style={[
                          styles.transactionStatus,
                          {
                            color: income
                              ? theme.colors.success
                              : theme.colors.muted,
                          },
                        ]}
                      >
                        {income ? 'Đã cộng' : 'Thành công'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({
  title,
  value,
  hint,
  icon,
  color,
  background,
  styles,
}: {
  title: string;
  value: string;
  hint: string;
  icon: AppIconName;
  color: string;
  background: string;
  styles: DashboardStyles;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={[styles.statIcon, { backgroundColor: background }]}>
          <AppIcon name={icon} size={22} color={color} />
        </View>
      </View>
      <View style={styles.statBottom}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.statValue, { color }]}
        >
          {value}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.statHint,
            { color, backgroundColor: background + '66' },
          ]}
        >
          {hint}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    hero: {
      minHeight: 223,
      padding: 20,
      borderRadius: 16,
      boxShadow: '0px 5px 9px rgba(19,27,46,.13)',
    },
    heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    greeting: {
      color: '#FFFFFF',
      fontSize: 29,
      lineHeight: 38,
      fontWeight: '600',
      letterSpacing: -1,
    },
    report: { color: '#DCE6FF', fontSize: 15, lineHeight: 21 },
    addButton: {
      width: 136,
      minHeight: 49,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,.2)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    addText: {
      color: '#FFFFFF',
      fontSize: 14,
      lineHeight: 17,
      fontWeight: '600',
      textAlign: 'center',
    },
    balanceLabel: {
      marginTop: 30,
      color: '#B4C5FF',
      fontSize: 13,
      fontWeight: '600',
    },
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    balance: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 40,
      lineHeight: 55,
      fontWeight: '700',
      letterSpacing: -1,
    },
    balanceDot: {
      width: 24,
      height: 9,
      backgroundColor: theme.colors.success,
      borderRadius: 5,
    },
    insight: {
      minHeight: 80,
      padding: 17,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceRaised,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    aiIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: '#D51A4C',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiBadge: { color: '#D51A4C', fontSize: 13, fontWeight: '600' },
    insightMessage: { color: theme.colors.muted, fontSize: 14, marginTop: 4 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
    sectionLink: {
      color: theme.colors.primaryStrong,
      fontSize: 14,
      fontWeight: '500',
    },
    stats: { gap: 14 },
    stat: {
      minHeight: 124,
      padding: 17,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 2px 2px rgba(19,27,46,.035)',
    },
    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statTitle: { color: theme.colors.muted, fontSize: 16, fontWeight: '400' },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statBottom: {
      marginTop: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    statValue: { fontSize: 25, fontWeight: '600', flexShrink: 1 },
    statHint: {
      fontSize: 12,
      fontWeight: '500',
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      maxWidth: '52%',
    },
    card: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 2px 2px rgba(19,27,46,.035)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 20,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: -0.4,
    },
    cardSubtitle: { color: theme.colors.muted, fontSize: 14, marginTop: 4 },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.neutralSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginTop: 8,
    },
    donutPercent: { color: theme.colors.text, fontSize: 22, fontWeight: '600' },
    donutLabel: { color: theme.colors.subtle, fontSize: 12, marginTop: 3 },
    legend: { flex: 1, gap: 17 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    legendName: { flex: 1, color: theme.colors.text, fontSize: 14 },
    legendValue: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'right',
    },
    legendPercent: {
      color: theme.colors.muted,
      fontSize: 13,
      textAlign: 'right',
      marginTop: 3,
    },
    chartLegend: { flexDirection: 'row', gap: 10 },
    transaction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 90,
    },
    transactionIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transactionName: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    transactionMeta: { color: theme.colors.subtle, fontSize: 13, marginTop: 8 },
    transactionAmount: { fontSize: 20, fontWeight: '500' },
    transactionStatus: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  });
