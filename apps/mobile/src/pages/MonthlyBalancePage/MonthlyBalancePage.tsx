import { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, ChoiceChips, ProgressBar, Screen, SectionTitle, StateMessage, ui } from '@/components/ui';
import { IconTile, money } from '@/components/finance';
import { BarChart } from '@/components/charts';
import { apiRequest } from '@/lib/api';
import { theme } from '@/theme';

interface YearReport { year: number; totalIncome: number; totalExpense: number; netSavings: number; walletBalanceTotal: number; monthlyData: { month: number; label: string; income: number; salaryIncome: number; expense: number; savings: number }[] }

export default function MonthlyBalancePage() {
  const current = new Date().getFullYear(); const [year, setYear] = useState(String(current));
  const query = useQuery({ queryKey: ['year-report', year], queryFn: () => apiRequest<YearReport>(`/transactions/report/yearly?year=${year}`) });
  const data = query.data; const savingRate = data?.totalIncome ? Math.max(0, Math.round(data.netSavings / data.totalIncome * 100)) : 0;
  return <Screen title="Tiết kiệm tháng"><ChoiceChips value={year} options={[current - 1, current, current + 1].map((item) => ({ label: String(item), value: String(item) }))} onChange={setYear} />{query.isLoading && <StateMessage loading message="Đang tổng hợp năm…" />}{data && <><View style={ui.row}><View style={{ flex: 1 }}><Card><IconTile name="bank-outline" /><Text style={ui.muted}>Tài sản</Text><Text adjustsFontSizeToFit numberOfLines={1} style={ui.heading}>{money(data.walletBalanceTotal)}</Text></Card></View><View style={{ flex: 1 }}><Card><IconTile name="piggy-bank-outline" color={theme.colors.warning} background="#FFFBEB" /><Text style={ui.muted}>Tích lũy</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[ui.heading, ui.positive]}>{money(data.netSavings)}</Text></Card></View></View><Card><View style={ui.between}><Text style={ui.heading}>Tỷ lệ tiết kiệm</Text><Text style={[ui.amount, ui.positive]}>{savingRate}%</Text></View><ProgressBar value={savingRate} tone="success" /><Text style={ui.muted}>Tổng thu {money(data.totalIncome)} · Tổng chi {money(data.totalExpense)}</Text></Card><SectionTitle title="Dòng tiền 12 tháng" /><Card><BarChart data={data.monthlyData.map((item) => ({ label: item.label, income: item.income, expense: item.expense }))} /></Card>{data.monthlyData.map((item) => <Card key={item.month}><View style={ui.between}><Text style={ui.text}>Tháng {item.month}</Text><Text style={item.savings >= 0 ? ui.positive : ui.negative}>{money(item.savings)}</Text></View><Text style={ui.muted}>Thu {money(item.income)} · Chi {money(item.expense)}</Text></Card>)}</>}</Screen>;
}
