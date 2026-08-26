import { type ComponentProps } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, StateMessage } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Dashboard } from '@/types/api';
import { theme } from '@/theme';

type Report = { categoryExpenses?: { id: string; name: string; amount: number; color?: string }[] };
type Trend = { label?: string; month?: number; income: number; expense: number };
type Insight = { insights?: { title: string; message: string }[] };
const money = (value: number | string = 0) => `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`;
const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const now = new Date();
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => apiRequest<Dashboard>('/transactions/dashboard') });
  const report = useQuery({ queryKey: ['monthly-report', now.getMonth() + 1, now.getFullYear()], queryFn: () => apiRequest<Report>(`/transactions/report?month=${now.getMonth() + 1}&year=${now.getFullYear()}`) });
  const trend = useQuery({ queryKey: ['monthly-trend', 6], queryFn: () => apiRequest<Trend[]>('/transactions/trend?months=6') });
  const insight = useQuery({ queryKey: ['ai-analysis-dash'], queryFn: () => apiRequest<Insight>('/ai/analyze/expenses') });
  const refresh = () => { void dashboard.refetch(); void report.refetch(); void trend.refetch(); void insight.refetch(); };
  const data = dashboard.data;
  const topInsight = insight.data?.insights?.[0];
  const categories = report.data?.categoryExpenses || [];
  const barData = (trend.data || []).map((item) => ({ label: item.label || (item.month ? months[item.month - 1] : ''), income: item.income, expense: item.expense }));
  const savings = data ? data.netWorth - data.monthlyExpense : 0;

  return <Screen title="Tổng quan" refreshing={dashboard.isRefetching} onRefresh={refresh}>
    {dashboard.isLoading && <StateMessage loading message="Đang tải tổng quan tài chính…" />}
    {dashboard.isError && <StateMessage message="Không thể tải tổng quan. Kéo xuống để thử lại." />}
    {data && <>
      <View style={styles.hero}>
        <View style={styles.badge}><MaterialCommunityIcons name="lightning-bolt" size={14} color="#0764B8" /><Text style={styles.badgeText}>TỔNG QUAN TÀI CHÍNH</Text></View>
        <View style={styles.heroRow}><View style={{ flex: 1 }}><Text style={styles.greeting}>Xin chào,{`\n`}{user?.fullName?.split(' ').pop() || 'bạn'} 👋</Text><Text style={styles.report}>Báo cáo thông minh cho tháng <Text style={styles.bold}>{now.getMonth() + 1}/{now.getFullYear()}</Text></Text></View></View>
        <Pressable accessibilityRole="button" style={styles.addButton} onPress={() => router.push('/add-transaction' as Href)}><MaterialCommunityIcons name="plus" size={22} color="#FFF" /><Text style={styles.addText}>Thêm giao dịch</Text></Pressable>
        {topInsight && <Pressable style={styles.insight} onPress={() => router.push('/(tabs)/advisor' as Href)}><View style={styles.aiIcon}><MaterialCommunityIcons name="creation" size={22} color="#005F82" /></View><View style={{ flex: 1 }}><View style={styles.insightTitleRow}><Text style={styles.aiBadge}>AI ADVISOR</Text><Text numberOfLines={1} style={styles.insightTitle}>{topInsight.title}</Text></View><Text numberOfLines={2} style={styles.insightMessage}>{topInsight.message}</Text></View><MaterialCommunityIcons name="chevron-right" size={23} color="#075B82" /></Pressable>}
      </View>

      <View style={styles.stats}>
        <Stat title="TỔNG TÀI SẢN" value={money(data.netWorth)} hint="Số dư khả dụng trong tất cả ví" icon="wallet-outline" color="#0873C9" background="#E3F2FD" />
        <Stat title="CHI TIÊU THÁNG NÀY" value={money(data.monthlyExpense)} hint={`Chi trực tiếp: ${money(data.monthlyExpense)}`} icon="trending-down" color="#EF4444" background="#FFE7E7" />
        <Stat title="TIẾT KIỆM THÁNG NÀY" value={money(savings)} hint="Tổng tài sản - chi tiêu tháng này" icon="creation" color="#007C9C" background="#CFF5FB" success />
      </View>

      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Chi tiêu theo danh mục</Text><Text style={styles.cardTag}>THÁNG NÀY</Text></View><View style={styles.donut}><View style={styles.donutCenter}><Text style={styles.donutLabel}>Tổng chi</Text><Text style={styles.donutValue}>{money(data.monthlyExpense)}</Text></View></View>{categories.slice(0, 3).map((category, index) => <View key={category.id} style={styles.legendRow}><View style={[styles.dot, { backgroundColor: category.color || ['#09B9ED', '#8B5CF6', '#10B981'][index] }]} /><Text style={styles.legendName}>{category.name}</Text><Text style={styles.legendValue}>{money(category.amount)}</Text></View>)}</View>
      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Thu nhập & Chi tiêu 6 tháng</Text><Text style={[styles.cardTag, { color: '#0873C9' }]}>XU HƯỚNG</Text></View>{barData.length ? <BarChart data={barData} /> : <StateMessage message="Chưa có dữ liệu xu hướng." />}<View style={styles.chartLegend}><View style={styles.legendKey}><View style={[styles.keyBox, { backgroundColor: theme.colors.success }]} /><Text style={styles.keyText}>Thu nhập</Text></View><View style={styles.legendKey}><View style={[styles.keyBox, { backgroundColor: theme.colors.danger }]} /><Text style={styles.keyText}>Chi tiêu</Text></View></View></View>
      <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>Giao dịch gần đây</Text><Pressable onPress={() => router.push('/(tabs)/transactions' as Href)}><Text style={[styles.cardTag, { color: '#0873C9' }]}>Xem tất cả →</Text></Pressable></View>{!data.recentTransactions.length && <StateMessage message="Chưa có giao dịch." />}{data.recentTransactions.slice(0, 5).map((item) => { const income = item.type === 'INCOME'; return <View key={item.id} style={styles.transaction}><View style={[styles.transactionIcon, { backgroundColor: income ? '#E5F8F3' : '#FFE8E8' }]}><MaterialCommunityIcons name={income ? 'arrow-bottom-left' : 'arrow-top-right'} size={18} color={income ? '#0AAA78' : '#EF4444'} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.transactionName}>{item.note || item.category?.name || 'Giao dịch'}</Text><Text style={styles.transactionMeta}>{item.category?.name} · {new Date(item.transactionDate).toLocaleDateString('vi-VN')}</Text></View><Text style={[styles.transactionAmount, { color: income ? '#00A86B' : '#E11D48' }]}>{income ? '+' : '-'}{money(item.amount)}</Text></View>; })}</View>
    </>}
  </Screen>;
}

function Stat({ title, value, hint, icon, color, background, success }: { title: string; value: string; hint: string; icon: ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; background: string; success?: boolean }) {
  return <View style={styles.stat}><View style={styles.statTop}><Text style={styles.statTitle}>{title}</Text><View style={[styles.statIcon, { backgroundColor: background }]}><MaterialCommunityIcons name={icon} size={18} color={color} /></View></View><Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text><Text numberOfLines={1} style={[styles.statHint, success && { color: '#00A86B' }]}>{hint}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#FFF', borderRadius: 13, padding: 27, borderWidth: 1, borderColor: '#FFF', shadowColor: '#5E7B96', shadowOpacity: .1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E4F3FF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }, badgeText: { color: '#0764B8', fontSize: 10, fontWeight: '900' }, heroRow: { flexDirection: 'row', marginTop: 11 }, greeting: { color: '#111827', fontSize: 41, lineHeight: 49, fontWeight: '900', letterSpacing: -1.5 }, report: { color: '#3E4957', fontSize: 15, lineHeight: 21, marginTop: 5 }, bold: { fontWeight: '900' },
  addButton: { marginTop: 19, height: 43, borderRadius: 9, backgroundColor: '#00759A', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#0873C9', shadowOpacity: .28, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 }, addText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  insight: { marginTop: 27, minHeight: 92, borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 10, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFF', shadowColor: '#64748B', shadowOpacity: .08, shadowRadius: 10, elevation: 2 }, aiIcon: { width: 41, height: 41, borderRadius: 21, backgroundColor: '#0ABAE9', alignItems: 'center', justifyContent: 'center' }, insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, aiBadge: { backgroundColor: '#E6F2FF', color: '#0764B8', fontSize: 8, fontWeight: '900', paddingHorizontal: 5, paddingVertical: 4 }, insightTitle: { flex: 1, color: '#111827', fontSize: 12 }, insightMessage: { color: '#445268', fontSize: 12, lineHeight: 17, marginTop: 4 },
  stats: { gap: 11, marginTop: 12 }, stat: { minHeight: 107, backgroundColor: '#FFF', borderRadius: 11, padding: 18, borderWidth: 1, borderColor: '#EDF0F4' }, statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, statTitle: { color: '#445268', fontSize: 10, fontWeight: '700' }, statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, statValue: { color: '#101827', fontSize: 25, fontWeight: '900', marginTop: -4 }, statHint: { color: '#697586', fontSize: 9, marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 11, borderWidth: 1, borderColor: '#EDF0F4', padding: 18, marginTop: 12 }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }, cardTitle: { color: '#111827', fontSize: 14, fontWeight: '900' }, cardTag: { color: '#B1BBC9', fontSize: 9, fontWeight: '800' }, donut: { width: 210, height: 210, borderRadius: 105, borderWidth: 27, borderColor: '#09B9ED', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 4 }, donutCenter: { alignItems: 'center' }, donutLabel: { color: '#697586', fontSize: 11 }, donutValue: { color: '#111827', fontSize: 16, fontWeight: '900' }, legendRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 }, dot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 }, legendName: { flex: 1, color: '#445268', fontSize: 11 }, legendValue: { color: '#111827', fontSize: 11, fontWeight: '900' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 }, legendKey: { flexDirection: 'row', alignItems: 'center', gap: 6 }, keyBox: { width: 9, height: 9, borderRadius: 2 }, keyText: { color: '#526073', fontSize: 10 },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 61, borderTopWidth: 1, borderTopColor: '#F1F3F6' }, transactionIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, transactionName: { color: '#111827', fontSize: 12, fontWeight: '800' }, transactionMeta: { color: '#697586', fontSize: 9, marginTop: 2 }, transactionAmount: { fontSize: 11, fontWeight: '900' },
});
