import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

export function BarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const max = Math.max(1, ...data.flatMap((item) => [Number(item.income), Number(item.expense)]));
  return <View style={styles.chart}>{data.map((item) => <View key={item.label} style={styles.column}><View style={styles.bars}><View style={[styles.bar, styles.income, { height: Math.max(3, Number(item.income) / max * 120) }]} /><View style={[styles.bar, styles.expense, { height: Math.max(3, Number(item.expense) / max * 120) }]} /></View><Text style={styles.label}>{item.label}</Text></View>)}</View>;
}

const styles = StyleSheet.create({ chart: { height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 10 }, column: { flex: 1, alignItems: 'center', gap: 7 }, bars: { height: 124, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }, bar: { width: 8, borderRadius: 6 }, income: { backgroundColor: theme.colors.success }, expense: { backgroundColor: theme.colors.danger }, label: { color: theme.colors.muted, fontSize: 10, fontWeight: '700' } });
