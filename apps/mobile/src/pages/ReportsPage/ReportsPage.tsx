import { Text } from '@/components/design-text';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/app-icon';
import { categoryAppearance } from '@/components/design';
import { useAppTheme, type AppTheme } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Card,
  EmptyState,
  Screen,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { money } from '@/components/finance';
import { BarChart } from '@/components/charts';
import { apiDownload, apiRequest } from '@/lib/api';

interface Trend {
  month: number;
  year: number;
  label: string;
  income: number;
  expense: number;
  remaining: number;
}
interface MonthlyReport {
  summary: { totalIncome: number; totalExpense: number; netSavings: number };
  categoryExpenses: {
    id: string;
    name: string;
    color: string;
    amount: number;
  }[];
}
interface YearlyReport {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  accountCreatedAt?: string | null;
  categoryExpenses: MonthlyReport['categoryExpenses'];
  monthlyData: Trend[];
}

/**
 * Render the reports page interface.
 *
 * Use it to keep the reports page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered reports page interface.
 */
export default function ReportsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [showAll, setShowAll] = useState(false);
  const now = new Date();
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const future =
    year > now.getFullYear() ||
    (reportType === 'monthly' &&
      year === now.getFullYear() &&
      month > now.getMonth() + 1);
  const monthly = useQuery({
    queryKey: ['monthly-report', month, year],
    /**
     * Load reports page data for the query cache.
     *
     * Use it to keep the reports page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting reports page value for the caller.
     */
    queryFn: () =>
      apiRequest<MonthlyReport>(
        `/transactions/report?month=${month}&year=${year}`,
      ),
    enabled: reportType === 'monthly' && !future,
  });
  const yearly = useQuery({
    queryKey: ['yearly-report', year],
    /**
     * Load reports page data for the query cache.
     *
     * Use it to keep the reports page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting reports page value for the caller.
     */
    queryFn: () =>
      apiRequest<YearlyReport>(`/transactions/report/yearly?year=${year}`),
    enabled: reportType === 'yearly' && !future,
  });
  const summary =
    reportType === 'monthly' ? monthly.data?.summary : yearly.data;
  const categories =
    reportType === 'monthly'
      ? monthly.data?.categoryExpenses || []
      : yearly.data?.categoryExpenses || [];
  const yearlyChart = (yearly.data?.monthlyData || []).filter((item) => {
    const itemMonth = new Date(year, item.month - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const created = yearly.data?.accountCreatedAt
      ? new Date(yearly.data.accountCreatedAt)
      : null;
    const createdMonth = created
      ? new Date(created.getFullYear(), created.getMonth(), 1)
      : null;
    return (
      itemMonth <= currentMonth && (!createdMonth || itemMonth >= createdMonth)
    );
  });
  const chart =
    reportType === 'monthly'
      ? [
          {
            month,
            year,
            label: `T${month}`,
            income: summary?.totalIncome || 0,
            expense: summary?.totalExpense || 0,
            remaining: summary?.netSavings || 0,
          },
        ]
      : yearlyChart;
  /**
   * Shift reports page within the reports page reporting range.
   *
   * Use it to keep the reports page workflow's presentation and interactions in one reusable UI boundary.
   * @param step - The step value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const shift = (step: number) => {
    if (reportType === 'yearly') {
      setYear((value) => value + step);
      return;
    }
    const next = new Date(year, month - 1 + step, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
  };
  const loading =
    reportType === 'monthly' ? monthly.isLoading : yearly.isLoading;
  /**
   * Export report from the reports page workflow.
   *
   * Use it to keep the reports page workflow's presentation and interactions in one reusable UI boundary.
   * @param format - The format value required by the operation.
   * @returns A promise that resolves after the operation completes.
   */
  const exportReport = async (format: 'pdf' | 'excel') => {
    if (future || reportType !== 'monthly') return;
    setExporting(format);
    try {
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      const mimeType =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const bytes = await apiDownload(
        `/attachments/export/${format}?month=${month}&year=${year}`,
      );
      const file = new File(
        Paths.cache,
        `baocao-T${month}-${year}.${extension}`,
      );
      file.create({ overwrite: true, intermediates: true });
      file.write(bytes);
      if (!(await Sharing.isAvailableAsync()))
        throw new Error('Thiết bị không hỗ trợ chia sẻ tệp.');
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: `Báo cáo tháng ${month}/${year}`,
      });
    } catch (error) {
      Alert.alert(
        'Không thể xuất báo cáo',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <Screen title="Báo cáo">
      <LinearGradient
        colors={['#1C60EE', '#0A267B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>BÁO CÁO ĐỊNH KỲ</Text>
            <Text style={styles.title}>Báo cáo tài chính</Text>
          </View>
          <View style={styles.toggle}>
            {(['monthly', 'yearly'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setReportType(value)}
                style={[
                  styles.toggleItem,
                  reportType === value && { backgroundColor: '#FFFFFF' },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    textAlign: 'center',
                    color:
                      reportType === value
                        ? theme.colors.primaryStrong
                        : '#DBE1FF',
                  }}
                >
                  {value === 'monthly' ? 'Theo tháng' : 'Theo năm'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.period}>
          <Pressable accessibilityLabel="Kỳ trước" onPress={() => shift(-1)}>
            <AppIcon name="chevron-left" size={23} color="#FFFFFF" />
          </Pressable>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
            {reportType === 'monthly'
              ? 'Tháng ' + month + ', ' + year
              : 'Năm ' + year}
          </Text>
          <Pressable accessibilityLabel="Kỳ sau" onPress={() => shift(1)}>
            <AppIcon name="chevron-right" size={23} color="#FFFFFF" />
          </Pressable>
        </View>
        {reportType === 'monthly' && !future && (
          <View style={styles.exports}>
            {(['pdf', 'excel'] as const).map((format) => (
              <Pressable
                key={format}
                disabled={!!exporting}
                onPress={() => void exportReport(format)}
                style={styles.exportButton}
              >
                <AppIcon name="download-outline" size={15} color="#FFFFFF" />
                <Text style={{ fontSize: 12, color: '#FFFFFF' }}>
                  {exporting === format
                    ? 'Đang xuất…'
                    : format === 'pdf'
                      ? 'Xuất PDF'
                      : 'Xuất Excel'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </LinearGradient>
      {future && (
        <EmptyState
          icon="calendar-alert"
          title="Không có dữ liệu"
          message="Kỳ báo cáo này chưa diễn ra. Hãy chọn tháng hoặc năm hiện tại hay trước đó."
        />
      )}
      {!future && loading && (
        <StateMessage loading message="Đang phân tích dữ liệu…" />
      )}
      {!future &&
        (reportType === 'monthly' ? monthly.isError : yearly.isError) && (
          <StateMessage message="Không thể tải báo cáo. Vui lòng thử lại." />
        )}
      {!future && summary && (
        <View style={{ gap: 14 }}>
          <ReportMetric
            label="TỔNG THU NHẬP THÁNG NÀY"
            value={money(summary.totalIncome)}
            icon="trending-up"
            colors={['#009370', '#005438']}
            caption="Có đủ số dư để chi trả trong tháng"
          />
          <ReportMetric
            label="TỔNG CHI TIÊU"
            value={money(summary.totalExpense)}
            icon="trending-down"
            colors={['#D8214B', '#AD0033']}
            caption="Nằm trong định mức an toàn ngân sách"
          />
          <ReportMetric
            label="TIẾT KIỆM"
            value={money(summary.netSavings)}
            icon="piggy-bank-outline"
            colors={['#0B58E5', '#10266C']}
            caption={
              Math.round(
                (summary.netSavings / Math.max(summary.totalIncome, 1)) * 100,
              ) + '% tỷ lệ tiết kiệm'
            }
            progress={
              (summary.netSavings / Math.max(summary.totalIncome, 1)) * 100
            }
          />
        </View>
      )}
      {!future && (
        <>
          <Card>
            <View style={ui.between}>
              <View>
                <Text style={ui.heading}>
                  {reportType === 'monthly'
                    ? 'Thu chi tháng này'
                    : 'Thu chi theo tháng'}
                </Text>
                <Text style={[ui.muted, { fontSize: 12, marginTop: 5 }]}>
                  {reportType === 'monthly'
                    ? 'Dữ liệu thực tế tháng ' + month + '/' + year
                    : 'Dữ liệu thực tế năm ' + year}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: theme.colors.success, fontSize: 12 }}>
                  ● Thu nhập
                </Text>
                <Text style={{ color: theme.colors.danger, fontSize: 12 }}>
                  ● Chi tiêu
                </Text>
              </View>
            </View>
            {reportType === 'monthly' ? (
              <View style={styles.monthlyChart}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 30,
                      right: 0,
                      top: i * 48,
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.surfaceRaised,
                    }}
                  >
                    <Text
                      style={{
                        position: 'absolute',
                        right: '100%',
                        width: 30,
                        top: -7,
                        fontSize: 10,
                        color: theme.colors.subtle,
                      }}
                    >
                      {i === 4
                        ? '0đ'
                        : (
                            (Math.max(
                              summary?.totalIncome || 0,
                              summary?.totalExpense || 0,
                            ) *
                              (4 - i)) /
                            4000
                          ).toFixed(1) + 'k'}
                    </Text>
                  </View>
                ))}
                {[
                  {
                    label: 'Thu',
                    value: summary?.totalIncome || 0,
                    color: theme.colors.success,
                  },
                  {
                    label: 'Chi',
                    value: summary?.totalExpense || 0,
                    color: theme.colors.danger,
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingBottom: 24,
                    }}
                  >
                    <Text
                      style={{
                        color: item.color,
                        fontSize: 12,
                        fontWeight: '500',
                        marginBottom: 6,
                      }}
                    >
                      {money(item.value)}
                    </Text>
                    <LinearGradient
                      colors={[item.color, item.color]}
                      style={{
                        height: Math.max(
                          3,
                          (item.value /
                            Math.max(
                              summary?.totalIncome || 1,
                              summary?.totalExpense || 1,
                            )) *
                            170,
                        ),
                        width: 65,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                      }}
                    />
                    <Text
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        fontSize: 13,
                        color: theme.colors.muted,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <BarChart data={chart} />
            )}
            <View style={styles.chartFooter}>
              <Text style={{ color: theme.colors.primaryStrong, fontSize: 12 }}>
                ↗ Tỷ lệ tháng dư thu chi:{' '}
                {summary?.totalIncome
                  ? (
                      (Number(summary.netSavings) /
                        Number(summary.totalIncome)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </Text>
              <Pressable
                onPress={() =>
                  setReportType(reportType === 'monthly' ? 'yearly' : 'monthly')
                }
              >
                <Text
                  style={{ color: theme.colors.primaryStrong, fontSize: 12 }}
                >
                  Chi tiết nhật ký ›
                </Text>
              </Pressable>
            </View>
          </Card>
          <Card>
            <View style={ui.between}>
              <View>
                <Text style={ui.heading}>Cơ cấu chi tiêu</Text>
                <Text style={[ui.muted, { fontSize: 12, marginTop: 5 }]}>
                  Phân bổ chi tiêu theo nhóm
                </Text>
              </View>
              <Text style={styles.structureBadge}>Theo dõi từng chi</Text>
            </View>
            {!loading && !categories.length && (
              <EmptyState
                icon="chart-donut"
                title="Chưa có dữ liệu"
                message="Các giao dịch chi trong kỳ sẽ được tổng hợp tại đây."
              />
            )}
            {(showAll ? categories : categories.slice(0, 5)).map((item) => {
              const appearance = categoryAppearance(item.name);
              const percent =
                (Number(item.amount) /
                  Math.max(Number(summary?.totalExpense || 1), 1)) *
                100;
              return (
                <View key={item.id} style={{ gap: 7 }}>
                  <View style={ui.between}>
                    <View style={ui.row}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: appearance.soft,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon
                          name={appearance.icon}
                          size={20}
                          color={appearance.color}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: theme.colors.text,
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.subtle,
                            marginTop: 3,
                          }}
                        >
                          {Math.round(percent)}% tổng chi
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: theme.colors.text,
                      }}
                    >
                      {money(item.amount)}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 7,
                      borderRadius: 5,
                      backgroundColor: theme.colors.surfaceRaised,
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: (Math.min(100, percent) + '%') as `${number}%`,
                        borderRadius: 5,
                        backgroundColor: item.color || appearance.color,
                      }}
                    />
                  </View>
                </View>
              );
            })}
            {categories.length > 5 && (
              <Pressable
                onPress={() => setShowAll((value) => !value)}
                style={styles.showAll}
              >
                <Text
                  style={{ color: theme.colors.primaryStrong, fontSize: 13 }}
                >
                  {showAll
                    ? 'Thu gọn'
                    : 'Xem tất cả ' + categories.length + ' danh mục'}{' '}
                  ›
                </Text>
              </Pressable>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function ReportMetric({
  label,
  value,
  icon,
  colors,
  caption,
  progress,
}: {
  label: string;
  value: string;
  icon: import('@/components/app-icon').AppIconName;
  colors: [string, string];
  caption: string;
  progress?: number;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ padding: 20, borderRadius: 16, gap: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: 'rgba(255,255,255,.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '600' }}>
        {value}
      </Text>
      {progress !== undefined ? (
        <View
          style={{
            height: 7,
            backgroundColor: 'rgba(255,255,255,.2)',
            borderRadius: 5,
          }}
        >
          <View
            style={{
              height: '100%',
              width: (Math.max(0, Math.min(100, progress)) +
                '%') as `${number}%`,
              borderRadius: 5,
              backgroundColor: '#68F6BC',
            }}
          />
        </View>
      ) : (
        <Text style={{ color: '#E1FFEF', fontSize: 12 }}>{caption}</Text>
      )}
    </LinearGradient>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    hero: { padding: 22, borderRadius: 16, gap: 15 },
    heroHeader: { flexDirection: 'row', gap: 20, alignItems: 'center' },
    eyebrow: { fontSize: 12, color: '#C4D4FF', fontWeight: '600' },
    title: {
      fontSize: 28,
      lineHeight: 37,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 5,
    },
    toggle: {
      width: 160,
      padding: 5,
      borderRadius: 10,
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,.15)',
    },
    toggleItem: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 9,
      borderRadius: 7,
    },
    period: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: 'rgba(255,255,255,.18)',
    },
    exports: { flexDirection: 'row', gap: 10 },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      padding: 8,
      borderRadius: 7,
      backgroundColor: 'rgba(255,255,255,.15)',
    },
    monthlyChart: {
      height: 220,
      marginTop: 16,
      flexDirection: 'row',
      paddingLeft: 30,
      paddingRight: 10,
    },
    chartFooter: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    structureBadge: {
      color: theme.colors.danger,
      backgroundColor: theme.colors.dangerSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      fontSize: 11,
    },
    showAll: {
      alignItems: 'center',
      padding: 14,
      borderRadius: 9,
      backgroundColor: theme.colors.surfaceRaised,
    },
  });
