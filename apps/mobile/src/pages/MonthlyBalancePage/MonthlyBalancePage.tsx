import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import {
  Card,
  MetricCard,
  Screen,
  SectionTitle,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { IconTile, money } from '@/components/finance';
import { BarChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';
import { useAppTheme, type AppTheme } from '@/theme';

interface YearReport {
  year: number;
  walletBalanceTotal: number;
  accountCreatedAt?: string | null;
  monthlyData: {
    month: number;
    label: string;
    income: number;
    walletBalance: number;
    expense: number;
    savings: number;
  }[];
}

export default function MonthlyBalancePage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const current = new Date().getFullYear();
  const [year, setYear] = useState(String(current));
  const query = useQuery({
    queryKey: ['year-report', year],
    queryFn: () =>
      apiRequest<YearReport>(`/transactions/report/yearly?year=${year}`),
  });
  const data = query.data;
  const accountCreatedAt = data?.accountCreatedAt
    ? new Date(data.accountCreatedAt)
    : null;
  const normalizedMonthlyData = (data?.monthlyData ?? [])
    .filter((item) => {
      const itemDate = new Date(Number(year), item.month - 1, 1);
      const currentMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );
      const createdMonth = accountCreatedAt
        ? new Date(
            accountCreatedAt.getFullYear(),
            accountCreatedAt.getMonth(),
            1,
          )
        : null;
      return (
        itemDate <= currentMonth && (!createdMonth || itemDate >= createdMonth)
      );
    })
    .map((item) => {
      const income = Number(item.walletBalance ?? item.income ?? 0);
      const expense = Number(item.expense || 0);
      return { ...item, income, expense, savings: income - expense };
    });
  const monthlyData = normalizedMonthlyData.map((item, index) => ({
    ...item,
    cumulativeSavings: normalizedMonthlyData
      .slice(0, index + 1)
      .reduce((sum, monthItem) => sum + monthItem.savings, 0),
  }));
  const totalIncome = monthlyData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = monthlyData.reduce((sum, item) => sum + item.expense, 0);
  const totalSavings = totalIncome - totalExpense;
  const savingRate = totalIncome
    ? Math.max(0, Math.round((totalSavings / totalIncome) * 100))
    : 0;

  const shiftYear = (step: number) => setYear(String(Number(year) + step));

  return (
    <Screen title="Tiết kiệm tháng">
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Dòng tiền</Text>
        <Text style={styles.title}>Tiết kiệm mỗi tháng</Text>
        <View style={styles.yearRow}>
          <Pressable
            accessibilityLabel="Năm trước"
            onPress={() => shiftYear(-1)}
            style={styles.arrowButton}
          >
            <AppIcon name="chevron-left" size={28} color={theme.colors.text} />
          </Pressable>
          <View style={styles.yearPill}>
            <AppIcon
              name="calendar-blank-outline"
              size={25}
              color={theme.colors.primaryStrong}
            />
            <Text style={styles.yearText}>Năm {year}</Text>
          </View>
          <Pressable
            accessibilityLabel="Năm sau"
            onPress={() => shiftYear(1)}
            style={styles.arrowButton}
          >
            <AppIcon name="chevron-right" size={28} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>
      {query.isLoading && <StateMessage loading message="Đang tổng hợp năm…" />}
      {data && !monthlyData.length && (
        <StateMessage message={`Chưa có dữ liệu trong năm ${year}.`} />
      )}
      {data && !!monthlyData.length && (
        <>
          <MetricCard
            label="Tổng thu nhập"
            value={money(totalIncome)}
            icon="trending-up"
            tone="success"
            caption="+38.2%"
          />
          <MetricCard
            label="Tổng chi tiêu"
            value={money(totalExpense)}
            icon="trending-down"
            tone="danger"
            caption="-12.4%"
          />
          <MetricCard
            label="Tiết kiệm trung bình"
            value={money(totalSavings / Math.max(monthlyData.length, 1))}
            icon="wallet-outline"
            caption={`Mục tiêu ${savingRate}%`}
          />
          <Card>
            <View>
              <Text style={styles.chartTitle}>Tiết kiệm theo tháng</Text>
              <Text style={ui.muted}>Biến động số dư tiết kiệm ròng</Text>
            </View>
            <BarChart
              data={monthlyData.map((item) => ({
                label: item.label,
                income: Math.max(0, item.savings),
                expense: Math.max(0, -item.savings),
              }))}
            />
          </Card>
          <SectionTitle
            title="Chi tiết từng tháng"
            caption={`${monthlyData.length} tháng gần nhất`}
          />
          {monthlyData.map((item) => (
            <Card key={item.month}>
              <View style={ui.between}>
                <View style={ui.row}>
                  <IconTile name="calendar-month-outline" />
                  <View>
                    <Text style={ui.text}>Tháng {item.month}</Text>
                    <Text style={ui.muted}>Đã kết toán</Text>
                  </View>
                </View>
                <View>
                  <Text style={ui.muted}>TIẾT KIỆM THÁNG</Text>
                  <Text
                    style={[
                      ui.heading,
                      item.savings >= 0 ? ui.positive : ui.negative,
                    ]}
                  >
                    {money(item.savings)}
                  </Text>
                </View>
              </View>
              <View style={styles.monthSummary}>
                <Text style={ui.muted}>
                  Tổng thu{`\n`}
                  <Text style={ui.positive}>{money(item.income)}</Text>
                </Text>
                <Text style={ui.muted}>
                  Chi tiêu{`\n`}
                  <Text style={ui.negative}>{money(item.expense)}</Text>
                </Text>
                <Text style={[ui.muted, styles.summaryRight]}>
                  Lũy kế tiết kiệm{`\n`}
                  <Text
                    style={
                      item.cumulativeSavings >= 0 ? ui.positive : ui.negative
                    }
                  >
                    {money(item.cumulativeSavings)}
                  </Text>
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    headerCard: {
      minHeight: 192,
      padding: 29,
      borderRadius: 17,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    eyebrow: {
      color: theme.colors.primaryStrong,
      fontSize: 15,
      fontWeight: '800',
    },
    title: {
      marginTop: 4,
      color: theme.colors.text,
      fontSize: 29,
      lineHeight: 34,
      fontWeight: '900',
      letterSpacing: -0.7,
    },
    yearRow: {
      marginTop: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    arrowButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceRaised,
    },
    yearPill: {
      minWidth: 156,
      height: 46,
      paddingHorizontal: 20,
      borderRadius: 23,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.surfaceRaised,
    },
    yearText: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
    chartTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '900' },
    monthSummary: {
      minHeight: 63,
      padding: 10,
      borderRadius: 11,
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceRaised,
    },
    summaryRight: { textAlign: 'right' },
  });
