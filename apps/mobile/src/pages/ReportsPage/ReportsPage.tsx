import { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, ChoiceChips, EmptyState, Screen, SectionTitle, StateMessage, ui } from '@/components/ui';
import { IconTile, money } from '@/components/finance';
import { BarChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';

interface Trend { month: number; year: number; label: string; income: number; expense: number; remaining: number }
interface MonthlyReport { summary: { totalIncome: number; totalExpense: number; netSavings: number }; categoryExpenses: { id: string; name: string; color: string; amount: number }[] }

export default function ReportsPage() {
  const now = new Date(); const [period, setPeriod] = useState('6');
  const trend = useQuery({ queryKey: ['trend', period], queryFn: () => apiRequest<Trend[]>(`/transactions/trend?months=${period}`) });
  const report = useQuery({ queryKey: ['monthly-report', now.getMonth(), now.getFullYear()], queryFn: () => apiRequest<MonthlyReport>(`/transactions/report?month=${now.getMonth() + 1}&year=${now.getFullYear()}`) });
  return <Screen title="Báo cáo"><SectionTitle title="Xu hướng dòng tiền" caption="So sánh thu và chi theo tháng" /><ChoiceChips value={period} options={[{ label: '3 tháng', value: '3' }, { label: '6 tháng', value: '6' }, { label: '12 tháng', value: '12' }]} onChange={setPeriod} />{trend.isLoading && <StateMessage loading message="Đang phân tích dữ liệu…" />}{trend.data && <Card><View style={ui.row}><Badge label="Thu nhập" tone="success" /><Badge label="Chi tiêu" tone="danger" /></View><BarChart data={trend.data} /></Card>}<SectionTitle title="Tháng hiện tại" caption={`Tháng ${now.getMonth() + 1}/${now.getFullYear()}`} />{report.data && <View style={ui.row}><View style={{ flex: 1 }}><Card><IconTile name="cash-plus" /><Text style={ui.muted}>Tổng thu</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[ui.heading, ui.positive]}>{money(report.data.summary.totalIncome)}</Text></Card></View><View style={{ flex: 1 }}><Card><IconTile name="cash-minus" /><Text style={ui.muted}>Tổng chi</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[ui.heading, ui.negative]}>{money(report.data.summary.totalExpense)}</Text></Card></View></View>}<SectionTitle title="Chi tiêu theo danh mục" />{!report.isLoading && !report.data?.categoryExpenses.length && <EmptyState icon="chart-donut" title="Chưa có dữ liệu" message="Các giao dịch chi trong tháng sẽ được tổng hợp tại đây." />}{report.data?.categoryExpenses.map((item) => <Card key={item.id}><View style={ui.between}><View style={ui.row}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} /><Text style={ui.text}>{item.name}</Text></View><Text style={ui.heading}>{money(item.amount)}</Text></View></Card>)}</Screen>;
}
