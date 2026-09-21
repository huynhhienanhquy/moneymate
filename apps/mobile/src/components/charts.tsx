import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

export function BarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  const max = Math.max(1, ...data.flatMap((item) => [Number(item.income), Number(item.expense)]));
  return <View style={styles.chart}>{data.map((item) => <View key={item.label} style={styles.column}><View style={styles.bars}><View style={[styles.bar, styles.income, { height: Math.max(3, Number(item.income) / max * 120) }]} /><View style={[styles.bar, styles.expense, { height: Math.max(3, Number(item.expense) / max * 120) }]} /></View><Text style={styles.label}>{item.label}</Text></View>)}</View>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({ chart: { height: theme.sizes.chart, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: theme.spacing.sm + 2 }, column: { flex: 1, alignItems: 'center', gap: theme.spacing.sm - 1 }, bars: { height: 124, flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.xs - 1 }, bar: { width: theme.spacing.sm, borderRadius: theme.spacing.sm - 2 }, income: { backgroundColor: theme.colors.success }, expense: { backgroundColor: theme.colors.danger }, label: { color: theme.colors.muted, fontSize: theme.typography.caption - 1, fontWeight: '700' } });
