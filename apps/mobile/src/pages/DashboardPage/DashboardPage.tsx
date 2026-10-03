import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const now = new Date();
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<Dashboard>('/transactions/dashboard'),
  });
  const report = useQuery({
    queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()],
    queryFn: () =>
      apiRequest<Report>(
        `/transactions/report?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      ),
  });
  const trend = useQuery({
    queryKey: ['monthly-trend', 6],
    queryFn: () => apiRequest<Trend[]>('/transactions/trend?months=6'),
  });
  const insight = useQuery({
    queryKey: ['ai-analysis-dash'],
    queryFn: () => apiRequest<Insight>('/ai/analyze/expenses'),
  });
  const refresh = () => {
    void dashboard.refetch();
    void report.refetch();
    void trend.refetch();
    void insight.refetch();
  };
  const data = dashboard.data;
  const topInsight = insight.data?.insights?.[0];
  const categories = report.data?.categoryExpenses || [];
  const categoryFallbacks = [
    theme.colors.cyan,
    theme.colors.violet,
    theme.colors.success,
  ];
  const barData = (trend.data || []).map((item) => ({
    label: item.label || (item.month ? months[item.month - 1] : ''),
    income: item.income,
    expense: item.expense,
  }));

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
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.flex}>
                <Text style={styles.greeting}>
                  Xin chào, {user?.fullName?.split(' ').pop() || 'bạn'} 👋
                </Text>
                <Text style={styles.report}>
                  Báo cáo thông minh cho tháng{`\n`}
                  <Text style={styles.bold}>
                    {now.getMonth() + 1}/{now.getFullYear()}
                  </Text>
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.addButton}
                onPress={() => router.push('/add-transaction' as Href)}
              >
                <AppIcon name="plus" size={20} color={theme.colors.onBrand} />
                <Text style={styles.addText}>Thêm{`\n`}nhanh</Text>
              </Pressable>
            </View>
            <Text style={styles.balanceLabel}>TỔNG SỐ DƯ KHẢ DỤNG</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balance}>
              {money(data.netWorth)}
            </Text>
          </View>
          {topInsight && (
            <Pressable
              accessibilityRole="button"
              style={styles.insight}
              onPress={() => router.push('/(tabs)/advisor' as Href)}
            >
              <View style={styles.aiIcon}>
                <AppIcon
                  name="creation"
                  size={24}
                  color={theme.colors.onBrand}
                />
              </View>
              <View style={styles.flex}>
                <View style={styles.insightTitleRow}>
                  <Text style={styles.aiBadge}>AI ADVISOR</Text>
                  <View style={styles.aiDot} />
                </View>
                <Text numberOfLines={1} style={styles.insightMessage}>
                  Chi nhiều nhất:{' '}
                  <Text style={styles.insightEmphasis}>{topInsight.title}</Text>{' '}
                  · {topInsight.message}
                </Text>
              </View>
              <AppIcon
                name="chevron-right"
                size={25}
                color={theme.colors.muted}
              />
            </Pressable>
          )}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              Tổng quan tháng {now.getMonth() + 1}
            </Text>
            <Text style={styles.sectionLink}>Thu & Chi</Text>
          </View>
          <View style={styles.stats}>
            <Stat
              styles={styles}
              title="TỔNG TÀI SẢN"
              value={money(data.netWorth)}
              hint="Số dư khả dụng trong tất cả ví"
              icon="wallet-outline"
              color={theme.colors.primaryStrong}
              background={theme.colors.primarySoft}
            />
            <Stat
              styles={styles}
              title="CHI TIÊU THÁNG NÀY"
              value={money(data.monthlyExpense)}
              hint={`Chi trực tiếp: ${money(data.monthlyExpense)}`}
              icon="trending-down"
              color={theme.colors.danger}
              background={theme.colors.dangerSoft}
            />
            <Stat
              styles={styles}
              title="TIẾT KIỆM THÁNG NÀY"
              value={money(data.monthlySavings ?? 0)}
              hint="Tổng tài sản - chi tiêu tháng này"
              icon="creation"
              color={theme.colors.successStrong}
              background={theme.colors.successSoft}
              successColor={theme.colors.successStrong}
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
                  size={20}
                  color={theme.colors.muted}
                />
              </View>
            </View>
            <View style={styles.categoryBody}>
              <View style={styles.donut}>
                <View style={styles.donutCenter}>
                  <Text style={styles.donutPercent}>
                    {categories.length && data.monthlyExpense
                      ? `${Math.round((Number(categories[0]?.amount || 0) / Number(data.monthlyExpense)) * 100)}%`
                      : '0%'}
                  </Text>
                  <Text style={styles.donutLabel}>Top 1</Text>
                </View>
              </View>
              <View style={styles.legend}>
                {categories.slice(0, 4).map((category, index) => (
                  <View key={category.id} style={styles.legendRow}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            category.color ||
                            categoryFallbacks[index % categoryFallbacks.length],
                        },
                      ]}
                    />
                    <Text style={styles.legendName}>{category.name}</Text>
                    <View>
                      <Text style={styles.legendValue}>
                        {money(category.amount)}
                      </Text>
                      <Text style={styles.legendPercent}>
                        {data.monthlyExpense
                          ? Math.round(
                              (Number(category.amount) /
                                Number(data.monthlyExpense)) *
                                100,
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
              <Text style={styles.cardTitle}>Thu nhập & Chi tiêu 6 tháng</Text>
              <Text style={styles.cardLink}>XU HƯỚNG</Text>
            </View>
            {barData.length ? (
              <BarChart data={barData} />
            ) : (
              <StateMessage message="Chưa có dữ liệu xu hướng." />
            )}
            <View style={styles.chartLegend}>
              <View style={styles.legendKey}>
                <View
                  style={[
                    styles.keyBox,
                    { backgroundColor: theme.colors.success },
                  ]}
                />
                <Text style={styles.keyText}>Thu nhập</Text>
              </View>
              <View style={styles.legendKey}>
                <View
                  style={[
                    styles.keyBox,
                    { backgroundColor: theme.colors.danger },
                  ]}
                />
                <Text style={styles.keyText}>Chi tiêu</Text>
              </View>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Giao dịch gần đây</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/transactions' as Href)}
              >
                <Text style={styles.cardLink}>Xem tất cả →</Text>
              </Pressable>
            </View>
            {!data.recentTransactions.some(
              (item) => item.type !== 'TRANSFER',
            ) && <StateMessage message="Chưa có giao dịch." />}
            {data.recentTransactions
              .filter((item) => item.type !== 'TRANSFER')
              .slice(0, 5)
              .map((item) => {
                const income = item.type === 'INCOME';
                return (
                  <View key={item.id} style={styles.transaction}>
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
                        name={income ? 'arrow-bottom-left' : 'arrow-top-right'}
                        size={theme.sizes.iconSmall}
                        color={
                          income
                            ? theme.colors.successStrong
                            : theme.colors.danger
                        }
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text numberOfLines={1} style={styles.transactionName}>
                        {item.note || item.category?.name || 'Giao dịch'}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {item.category?.name} ·{' '}
                        {new Date(item.transactionDate).toLocaleDateString(
                          'vi-VN',
                        )}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color: income
                            ? theme.colors.successStrong
                            : theme.colors.danger,
                        },
                      ]}
                    >
                      {income ? '+' : '-'}
                      {money(item.amount)}
                    </Text>
                  </View>
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
  successColor,
  styles,
}: {
  title: string;
  value: string;
  hint: string;
  icon: AppIconName;
  color: string;
  background: string;
  successColor?: string;
  styles: DashboardStyles;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <Text style={styles.statTitle}>{title}</Text>
        <View style={[styles.statIcon, { backgroundColor: background }]}>
          <AppIcon name={icon} size={18} color={color} />
        </View>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          styles.statHint,
          successColor ? { color: successColor } : undefined,
        ]}
      >
        {hint}
      </Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    hero: {
      minHeight: 224,
      backgroundColor: theme.colors.primary,
      borderRadius: 17,
      padding: 20,
      shadowColor: theme.colors.primaryDeep,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
      overflow: 'hidden',
      justifyContent: 'space-between',
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    greeting: {
      color: theme.colors.onBrand,
      fontSize: 29,
      lineHeight: 34,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    report: {
      color: 'rgba(255,255,255,.82)',
      fontSize: 14,
      lineHeight: 18,
      marginTop: 4,
    },
    balanceLabel: {
      marginTop: 22,
      color: 'rgba(255,255,255,.78)',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    balance: {
      marginTop: 3,
      color: theme.colors.onBrand,
      fontSize: 31,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    bold: { fontWeight: '900' },
    addButton: {
      width: 138,
      minHeight: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,.18)',
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addText: {
      color: theme.colors.onBrand,
      fontSize: 14,
      lineHeight: 16,
      textAlign: 'center',
      fontWeight: '900',
    },
    insight: {
      minHeight: 80,
      borderRadius: 15,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      backgroundColor: theme.colors.primarySoft,
    },
    aiIcon: {
      width: 45,
      height: 45,
      borderRadius: 13,
      backgroundColor: theme.colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    aiBadge: { color: theme.colors.danger, fontSize: 11, fontWeight: '900' },
    aiDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.danger,
    },
    insightMessage: {
      color: theme.colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 3,
    },
    insightEmphasis: { color: theme.colors.primaryStrong, fontWeight: '900' },
    sectionRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
    sectionLink: {
      color: theme.colors.primaryStrong,
      fontSize: 13,
      fontWeight: '800',
    },
    stats: { gap: theme.spacing.sm + 3, marginTop: theme.spacing.sm + 4 },
    stat: {
      minHeight: 107,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.sm + 1,
      padding: theme.spacing.md + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statTitle: {
      color: theme.colors.muted,
      fontSize: theme.typography.caption - 1,
      fontWeight: '700',
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      color: theme.colors.text,
      fontSize: theme.typography.heading + 3,
      fontWeight: '900',
      marginTop: -4,
    },
    statHint: {
      color: theme.colors.muted,
      fontSize: 9,
      marginTop: theme.spacing.xs,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.sm + 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md + 2,
      marginTop: theme.spacing.sm + 4,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm + 5,
    },
    cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
    cardSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    cardTag: { color: theme.colors.subtle, fontSize: 9, fontWeight: '800' },
    cardLink: {
      color: theme.colors.primaryStrong,
      fontSize: 12,
      fontWeight: '800',
    },
    categoryBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 22,
      paddingVertical: 12,
    },
    donut: {
      width: 132,
      height: 132,
      borderRadius: 66,
      borderWidth: 24,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenter: { alignItems: 'center' },
    donutPercent: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
    donutLabel: { color: theme.colors.muted, fontSize: 11 },
    legend: { flex: 1 },
    legendRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 9 },
    legendName: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    legendValue: {
      color: theme.colors.text,
      fontSize: 12,
      textAlign: 'right',
      fontWeight: '900',
    },
    legendPercent: {
      color: theme.colors.muted,
      fontSize: 10,
      textAlign: 'right',
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.lg - 4,
    },
    legendKey: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm - 2,
    },
    keyBox: { width: 9, height: 9, borderRadius: 2 },
    keyText: {
      color: theme.colors.muted,
      fontSize: theme.typography.caption - 1,
    },
    transaction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 3,
      minHeight: 61,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    transactionIcon: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.sm - 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transactionName: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '800',
    },
    transactionMeta: { color: theme.colors.muted, fontSize: 9, marginTop: 2 },
    transactionAmount: {
      fontSize: theme.typography.caption,
      fontWeight: '900',
    },
  });
