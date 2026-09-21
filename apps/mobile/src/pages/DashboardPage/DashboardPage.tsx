import { useMemo, type ComponentProps } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, StateMessage } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Dashboard } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

type Report = { categoryExpenses?: { id: string; name: string; amount: number; color?: string }[] };
type Trend = { label?: string; month?: number; income: number; expense: number };
type Insight = { insights?: { title: string; message: string }[] };
type DashboardStyles = ReturnType<typeof createStyles>;
const money = (value: number | string = 0) => `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`;
const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const now = new Date();
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => apiRequest<Dashboard>('/transactions/dashboard') });
  const report = useQuery({ queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()], queryFn: () => apiRequest<Report>(`/transactions/report?month=${now.getMonth() + 1}&year=${now.getFullYear()}`) });
  const trend = useQuery({ queryKey: ['monthly-trend', 6], queryFn: () => apiRequest<Trend[]>('/transactions/trend?months=6') });
  const insight = useQuery({ queryKey: ['ai-analysis-dash'], queryFn: () => apiRequest<Insight>('/ai/analyze/expenses') });
  const refresh = () => { void dashboard.refetch(); void report.refetch(); void trend.refetch(); void insight.refetch(); };
  const data = dashboard.data;
  const topInsight = insight.data?.insights?.[0];
  const categories = report.data?.categoryExpenses || [];
  const categoryFallbacks = [theme.colors.cyan, theme.colors.violet, theme.colors.success];
  const barData = (trend.data || []).map((item) => ({ label: item.label || (item.month ? months[item.month - 1] : ''), income: item.income, expense: item.expense }));

  return <Screen title="Tổng quan" refreshing={dashboard.isRefetching} onRefresh={refresh}>
    {dashboard.isLoading && <StateMessage loading message="Đang tải tổng quan tài chính…" />}
    {dashboard.isError && <StateMessage message="Không thể tải tổng quan. Kéo xuống để thử lại." />}
    {data && <>
      <View style={styles.hero}>
        <View style={styles.badge}><MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.colors.primaryDeep} /><Text style={styles.badgeText}>TỔNG QUAN TÀI CHÍNH</Text></View>
        <View style={styles.heroRow}><View style={styles.flex}><Text style={styles.greeting}>Xin chào,{`\n`}{user?.fullName?.split(' ').pop() || 'bạn'} 👋</Text><Text style={styles.report}>Báo cáo thông minh cho tháng <Text style={styles.bold}>{now.getMonth() + 1}/{now.getFullYear()}</Text></Text></View></View>
        <Pressable accessibilityRole="button" style={styles.addButton} onPress={() => router.push('/add-transaction' as Href)}><MaterialCommunityIcons name="plus" size={theme.sizes.icon} color={theme.colors.onBrand} /><Text style={styles.addText}>Thêm giao dịch</Text></Pressable>
        {topInsight && <Pressable accessibilityRole="button" style={styles.insight} onPress={() => router.push('/(tabs)/advisor' as Href)}><View style={styles.aiIcon}><MaterialCommunityIcons name="creation" size={theme.sizes.icon} color={theme.colors.onBrand} /></View><View style={styles.flex}><View style={styles.insightTitleRow}><Text style={styles.aiBadge}>AI ADVISOR</Text><Text numberOfLines={1} style={styles.insightTitle}>{topInsight.title}</Text></View><Text numberOfLines={2} style={styles.insightMessage}>{topInsight.message}</Text></View><MaterialCommunityIcons name="chevron-right" size={23} color={theme.colors.primaryStrong} /></Pressable>}
      </View>
      <View style={styles.stats}>
        <Stat styles={styles} title="TỔNG TÀI SẢN" value={money(data.netWorth)} hint="Số dư khả dụng trong tất cả ví" icon="wallet-outline" color={theme.colors.primaryStrong} background={theme.colors.primarySoft} />
        <Stat styles={styles} title="CHI TIÊU THÁNG NÀY" value={money(data.monthlyExpense)} hint={`Chi trực tiếp: ${money(data.monthlyExpense)}`} icon="trending-down" color={theme.colors.danger} background={theme.colors.dangerSoft} />
        <Stat styles={styles} title="TIẾT KIỆM THÁNG NÀY" value={money(data.monthlySavings ?? 0)} hint="Tổng tài sản - chi tiêu tháng này" icon="creation" color={theme.colors.successStrong} background={theme.colors.successSoft} successColor={theme.colors.successStrong} />
      </View>
      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Chi tiêu theo danh mục</Text><Text style={styles.cardTag}>THÁNG NÀY</Text></View><View style={styles.donut}><View style={styles.donutCenter}><Text style={styles.donutLabel}>Tổng chi</Text><Text style={styles.donutValue}>{money(data.monthlyExpense)}</Text></View></View>{categories.slice(0, 3).map((category, index) => <View key={category.id} style={styles.legendRow}><View style={[styles.dot, { backgroundColor: category.color || categoryFallbacks[index] }]} /><Text style={styles.legendName}>{category.name}</Text><Text style={styles.legendValue}>{money(category.amount)}</Text></View>)}</View>
      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Thu nhập & Chi tiêu 6 tháng</Text><Text style={styles.cardLink}>XU HƯỚNG</Text></View>{barData.length ? <BarChart data={barData} /> : <StateMessage message="Chưa có dữ liệu xu hướng." />}<View style={styles.chartLegend}><View style={styles.legendKey}><View style={[styles.keyBox, { backgroundColor: theme.colors.success }]} /><Text style={styles.keyText}>Thu nhập</Text></View><View style={styles.legendKey}><View style={[styles.keyBox, { backgroundColor: theme.colors.danger }]} /><Text style={styles.keyText}>Chi tiêu</Text></View></View></View>
      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Giao dịch gần đây</Text><Pressable onPress={() => router.push('/(tabs)/transactions' as Href)}><Text style={styles.cardLink}>Xem tất cả →</Text></Pressable></View>{!data.recentTransactions.length && <StateMessage message="Chưa có giao dịch." />}{data.recentTransactions.slice(0, 5).map((item) => { const income = item.type === 'INCOME'; return <View key={item.id} style={styles.transaction}><View style={[styles.transactionIcon, { backgroundColor: income ? theme.colors.successSoft : theme.colors.dangerSoft }]}><MaterialCommunityIcons name={income ? 'arrow-bottom-left' : 'arrow-top-right'} size={theme.sizes.iconSmall} color={income ? theme.colors.successStrong : theme.colors.danger} /></View><View style={styles.flex}><Text numberOfLines={1} style={styles.transactionName}>{item.note || item.category?.name || 'Giao dịch'}</Text><Text style={styles.transactionMeta}>{item.category?.name} · {new Date(item.transactionDate).toLocaleDateString('vi-VN')}</Text></View><Text style={[styles.transactionAmount, { color: income ? theme.colors.successStrong : theme.colors.danger }]}>{income ? '+' : '-'}{money(item.amount)}</Text></View>; })}</View>
    </>}
  </Screen>;
}

function Stat({ title, value, hint, icon, color, background, successColor, styles }: { title: string; value: string; hint: string; icon: ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; background: string; successColor?: string; styles: DashboardStyles }) {
  return <View style={styles.stat}><View style={styles.statTop}><Text style={styles.statTitle}>{title}</Text><View style={[styles.statIcon, { backgroundColor: background }]}><MaterialCommunityIcons name={icon} size={18} color={color} /></View></View><Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text><Text numberOfLines={1} style={[styles.statHint, successColor ? { color: successColor } : undefined]}>{hint}</Text></View>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  flex: { flex: 1 }, hero: { backgroundColor: theme.colors.glass, borderRadius: theme.radius.md, padding: theme.spacing.lg + 3, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.shadow, shadowOpacity: theme.dark ? .2 : .1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.sm + 4, paddingVertical: theme.spacing.xs }, badgeText: { color: theme.colors.primaryDeep, fontSize: theme.typography.caption - 1, fontWeight: '900' }, heroRow: { flexDirection: 'row', marginTop: theme.spacing.sm + 3 }, greeting: { color: theme.colors.text, fontSize: theme.typography.display + 11, lineHeight: 49, fontWeight: '900', letterSpacing: -1.5 }, report: { color: theme.colors.muted, fontSize: theme.typography.body, lineHeight: 21, marginTop: 5 }, bold: { fontWeight: '900' },
  addButton: { marginTop: 19, minHeight: theme.touchTarget, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primaryStrong, flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOpacity: .28, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 }, addText: { color: theme.colors.onBrand, fontSize: theme.typography.bodySmall, fontWeight: '900' },
  insight: { marginTop: theme.spacing.lg + 3, minHeight: 92, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: theme.spacing.sm + 5, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 3, backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow, shadowOpacity: theme.dark ? .18 : .08, shadowRadius: 10, elevation: 2 }, aiIcon: { width: theme.touchTarget - 3, height: theme.touchTarget - 3, borderRadius: theme.radius.pill, backgroundColor: theme.colors.cyan, alignItems: 'center', justifyContent: 'center' }, insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm - 1 }, aiBadge: { backgroundColor: theme.colors.primarySoft, color: theme.colors.primaryDeep, fontSize: 8, fontWeight: '900', paddingHorizontal: 5, paddingVertical: theme.spacing.xs }, insightTitle: { flex: 1, color: theme.colors.text, fontSize: 12 }, insightMessage: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, marginTop: theme.spacing.xs },
  stats: { gap: theme.spacing.sm + 3, marginTop: theme.spacing.sm + 4 }, stat: { minHeight: 107, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm + 1, padding: theme.spacing.md + 2, borderWidth: 1, borderColor: theme.colors.border }, statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, statTitle: { color: theme.colors.muted, fontSize: theme.typography.caption - 1, fontWeight: '700' }, statIcon: { width: 34, height: 34, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center' }, statValue: { color: theme.colors.text, fontSize: theme.typography.heading + 3, fontWeight: '900', marginTop: -4 }, statHint: { color: theme.colors.muted, fontSize: 9, marginTop: theme.spacing.xs },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm + 1, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md + 2, marginTop: theme.spacing.sm + 4 }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm + 5 }, cardTitle: { color: theme.colors.text, fontSize: theme.typography.bodySmall + 1, fontWeight: '900' }, cardTag: { color: theme.colors.subtle, fontSize: 9, fontWeight: '800' }, cardLink: { color: theme.colors.primaryStrong, fontSize: 9, fontWeight: '800' },
  donut: { width: theme.sizes.donut, height: theme.sizes.donut, borderRadius: theme.radius.pill, borderWidth: 27, borderColor: theme.colors.cyan, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: theme.spacing.xs }, donutCenter: { alignItems: 'center' }, donutLabel: { color: theme.colors.muted, fontSize: theme.typography.caption }, donutValue: { color: theme.colors.text, fontSize: theme.typography.body + 1, fontWeight: '900' }, legendRow: { flexDirection: 'row', alignItems: 'center', paddingTop: theme.spacing.sm + 2 }, dot: { width: 9, height: 9, borderRadius: theme.radius.pill, marginRight: theme.spacing.sm }, legendName: { flex: 1, color: theme.colors.muted, fontSize: theme.typography.caption }, legendValue: { color: theme.colors.text, fontSize: theme.typography.caption, fontWeight: '900' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.lg - 4 }, legendKey: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm - 2 }, keyBox: { width: 9, height: 9, borderRadius: 2 }, keyText: { color: theme.colors.muted, fontSize: theme.typography.caption - 1 },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 3, minHeight: 61, borderTopWidth: 1, borderTopColor: theme.colors.border }, transactionIcon: { width: 36, height: 36, borderRadius: theme.radius.sm - 1, alignItems: 'center', justifyContent: 'center' }, transactionName: { color: theme.colors.text, fontSize: 12, fontWeight: '800' }, transactionMeta: { color: theme.colors.muted, fontSize: 9, marginTop: 2 }, transactionAmount: { fontSize: theme.typography.caption, fontWeight: '900' },
});
