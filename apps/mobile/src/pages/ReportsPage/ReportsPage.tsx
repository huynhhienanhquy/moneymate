import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Badge,
  Button,
  Card,
  ChoiceChips,
  EmptyState,
  MetricCard,
  PageHero,
  Screen,
  SectionTitle,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { IconTile, money } from '@/components/finance';
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

export default function ReportsPage() {
  const ui = useUiStyles();
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
    queryFn: () =>
      apiRequest<MonthlyReport>(
        `/transactions/report?month=${month}&year=${year}`,
      ),
    enabled: reportType === 'monthly' && !future,
  });
  const yearly = useQuery({
    queryKey: ['yearly-report', year],
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
      <PageHero
        eyebrow="BÁO CÁO ĐỊNH KỲ"
        title="Báo cáo tài chính"
        subtitle={
          reportType === 'monthly'
            ? `Tổng hợp dòng tiền tháng ${month}/${year}`
            : `Tổng hợp dòng tiền năm ${year}`
        }
        icon="chart-box-outline"
      >
        <View style={{ marginTop: 15 }}>
          <ChoiceChips
            value={reportType}
            options={[
              { label: 'Theo tháng', value: 'monthly' },
              { label: 'Theo năm', value: 'yearly' },
            ]}
            onChange={(value) => setReportType(value as typeof reportType)}
          />
        </View>
        <View style={[ui.row, { marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <Button
              variant="secondary"
              label="‹ Kỳ trước"
              onPress={() => shift(-1)}
            />
          </View>
          <Text style={ui.heading}>
            {reportType === 'monthly' ? `T${month}/${year}` : `Năm ${year}`}
          </Text>
          <View style={{ flex: 1 }}>
            <Button
              variant="secondary"
              label="Kỳ sau ›"
              onPress={() => shift(1)}
            />
          </View>
        </View>
      </PageHero>
      {reportType === 'monthly' && !future && (
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <Button
              variant="secondary"
              label="Xuất PDF"
              loading={exporting === 'pdf'}
              disabled={!!exporting}
              onPress={() => {
                void exportReport('pdf');
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              variant="secondary"
              label="Xuất Excel"
              loading={exporting === 'excel'}
              disabled={!!exporting}
              onPress={() => {
                void exportReport('excel');
              }}
            />
          </View>
        </View>
      )}
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
      {!future && summary && (
        <View style={{ gap: 9 }}>
          <MetricCard
            label="Tổng thu nhập"
            value={money(summary.totalIncome)}
            icon="trending-up"
            tone="success"
          />
          <MetricCard
            label="Tổng chi tiêu"
            value={money(summary.totalExpense)}
            icon="trending-down"
            tone="danger"
          />
          <MetricCard
            label="Tiết kiệm"
            value={money(summary.netSavings)}
            icon="piggy-bank-outline"
            caption={`${Math.round((summary.netSavings / Math.max(summary.totalIncome, 1)) * 100)}% tỷ lệ tiết kiệm`}
          />
        </View>
      )}
      {!future && (
        <>
          <SectionTitle
            title={
              reportType === 'monthly'
                ? 'Thu chi tháng này'
                : 'Thu chi theo tháng'
            }
            caption="So sánh thu và chi"
          />
          {!!chart.length && (
            <Card>
              <View style={ui.row}>
                <Badge label="Thu nhập" tone="success" />
                <Badge label="Chi tiêu" tone="danger" />
              </View>
              <BarChart data={chart} />
            </Card>
          )}
          <SectionTitle
            title="Cơ cấu chi tiêu"
            caption={`${categories.length} danh mục`}
          />
          {!loading && !categories.length && (
            <EmptyState
              icon="chart-donut"
              title="Chưa có dữ liệu"
              message="Các giao dịch chi trong kỳ sẽ được tổng hợp tại đây."
            />
          )}
          {categories.map((item) => (
            <Card key={item.id}>
              <View style={ui.between}>
                <View style={ui.row}>
                  <IconTile
                    name="shape-outline"
                    color={item.color}
                    background={`${item.color}18`}
                  />
                  <Text style={ui.text}>{item.name}</Text>
                </View>
                <Text style={ui.heading}>{money(item.amount)}</Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
