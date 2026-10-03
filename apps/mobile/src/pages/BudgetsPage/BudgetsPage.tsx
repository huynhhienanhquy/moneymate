import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import {
  Badge,
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  MetricCard,
  PageHero,
  ProgressBar,
  Screen,
  SectionTitle,
  Sheet,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { ActionLink, EntityCard, IconTile, money } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import type { Budget, Category } from '@/types/api';
import { useAppTheme, type AppTheme } from '@/theme';

interface BudgetForecast {
  forecasts: {
    categoryId?: string | null;
    severity: string;
    message: string;
  }[];
}

export default function BudgetsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const initial = new Date();
  const client = useQueryClient();
  const [month, setMonth] = useState(initial.getMonth() + 1);
  const [year, setYear] = useState(initial.getFullYear());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const query = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => apiRequest<Budget[]>(`/budgets?month=${month}&year=${year}`),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories'),
  });
  const forecast = useQuery({
    queryKey: ['ai-forecast', month, year],
    queryFn: () =>
      apiRequest<BudgetForecast>(
        `/ai/budget/forecast?month=${month}&year=${year}`,
      ),
    staleTime: 120_000,
  });
  const save = useMutation({
    mutationFn: () =>
      apiRequest(editing ? `/budgets/${editing.id}` : '/budgets', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(
          editing
            ? { amount: Number(amount), categoryId: categoryId || null }
            : {
                amount: Number(amount),
                categoryId: categoryId || null,
                month,
                year,
              },
        ),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['budgets'] });
      setOpen(false);
    },
    onError: (error) =>
      Alert.alert(
        'Không thể lưu ngân sách',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['budgets'] }),
    onError: (error) =>
      Alert.alert(
        'Không thể xóa ngân sách',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  const start = (budget?: Budget) => {
    setEditing(budget || null);
    setAmount(String(budget?.amount || ''));
    setCategoryId(budget?.category?.id || '');
    setOpen(true);
  };
  const shiftMonth = (step: number) => {
    const next = new Date(year, month - 1 + step, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
  };
  const budgets = query.data || [];
  const total = budgets.reduce((sum, item) => sum + Number(item.amount), 0);
  const spent = budgets.reduce((sum, item) => sum + Number(item.spent || 0), 0);
  const remaining = Math.max(0, total - spent);
  const forecastMap = new Map(
    (forecast.data?.forecasts || []).map((item) => [
      item.categoryId || 'global',
      item,
    ]),
  );

  return (
    <Screen title="Ngân sách">
      <PageHero
        eyebrow="Quản lý Ngân sách"
        icon="chart-donut"
        action={
          <Pressable style={styles.heroAction} onPress={() => start()}>
            <AppIcon name="plus" size={20} color={theme.colors.primaryStrong} />
            <Text style={styles.heroActionText}>Thêm</Text>
          </Pressable>
        }
      >
        <View style={styles.period}>
          <Pressable
            accessibilityLabel="Tháng trước"
            onPress={() => shiftMonth(-1)}
          >
            <AppIcon
              name="chevron-left"
              size={27}
              color={theme.colors.onBrand}
            />
          </Pressable>
          <View style={styles.periodLabel}>
            <AppIcon
              name="calendar-month-outline"
              size={20}
              color={theme.colors.onBrand}
            />
            <Text style={styles.periodText}>
              Tháng {month} / {year}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Tháng sau"
            onPress={() => shiftMonth(1)}
          >
            <AppIcon
              name="chevron-right"
              size={27}
              color={theme.colors.onBrand}
            />
          </Pressable>
        </View>
      </PageHero>
      {!!budgets.length && (
        <View style={styles.metrics}>
          <MetricCard
            label="Tổng hạn mức"
            value={money(total)}
            icon="wallet-outline"
            caption={`${budgets.length} mục`}
          />
          <MetricCard
            label="Đã chi"
            value={money(spent)}
            icon="trending-down"
            tone="danger"
            caption={`${Math.round((spent / Math.max(total, 1)) * 100)}% mức chi`}
          />
          <MetricCard
            label="Còn lại"
            value={money(remaining)}
            icon="shield-check-outline"
            tone="success"
            caption={`${Math.round((remaining / Math.max(total, 1)) * 100)}% khả dụng`}
          />
        </View>
      )}
      <SectionTitle
        title="Danh sách ngân sách"
        caption={`${budgets.length} hạng mục`}
      />
      {query.isLoading && (
        <StateMessage loading message="Đang tải ngân sách…" />
      )}
      {query.isError && <StateMessage message="Không thể tải ngân sách." />}
      {!query.isLoading && !budgets.length && (
        <EmptyState
          icon="piggy-bank-outline"
          title="Chưa đặt ngân sách"
          message="Tạo hạn mức để nhận cảnh báo khi chi tiêu đạt 80% và 100%."
          action={<Button label="Tạo ngân sách" onPress={() => start()} />}
        />
      )}
      {budgets.map((budget) => {
        const rawPercent =
          budget.percentage ??
          ((budget.spent || 0) / Number(budget.amount)) * 100;
        const percent = Math.min(100, rawPercent);
        const tone =
          rawPercent >= 100
            ? 'danger'
            : rawPercent >= 80
              ? 'warning'
              : 'primary';
        const left = Number(budget.amount) - Number(budget.spent || 0);
        const categoryIcon =
          (budget.category?.icon as AppIconName) || 'wallet-outline';
        const budgetForecast = forecastMap.get(budget.categoryId || 'global');
        return (
          <EntityCard
            key={budget.id}
            icon={
              <IconTile
                name={categoryIcon}
                color={
                  tone === 'danger'
                    ? theme.colors.danger
                    : tone === 'warning'
                      ? theme.colors.warning
                      : theme.colors.primary
                }
                background={
                  tone === 'danger'
                    ? theme.colors.dangerSoft
                    : tone === 'warning'
                      ? theme.colors.warningSoft
                      : theme.colors.successSoft
                }
              />
            }
            title={budget.category?.name || 'Tổng ngân sách'}
            subtitle={budget.category ? 'Theo danh mục' : 'Toàn bộ chi tiêu'}
            badge={
              <Badge
                label={
                  tone === 'danger'
                    ? 'Vượt mức'
                    : tone === 'warning'
                      ? 'Cảnh báo'
                      : 'Tốt'
                }
                tone={tone === 'primary' ? 'success' : tone}
              />
            }
          >
            <View style={styles.budgetNumbers}>
              <View>
                <Text style={ui.muted}>Đã chi</Text>
                <Text style={styles.spent}>
                  {money(budget.spent || 0)}{' '}
                  <Text style={ui.muted}>/ {money(budget.amount)}</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.percentCircle,
                  {
                    borderColor:
                      tone === 'danger'
                        ? theme.colors.danger
                        : tone === 'warning'
                          ? theme.colors.warning
                          : theme.colors.success,
                  },
                ]}
              >
                <Text style={styles.percentText}>
                  {Math.round(rawPercent)}%
                </Text>
              </View>
            </View>
            <Text style={[ui.text, left < 0 ? ui.negative : ui.positive]}>
              Còn lại: {money(left)}
            </Text>
            <ProgressBar value={percent} tone={tone} />
            {budgetForecast && budgetForecast.severity !== 'OK' && (
              <View style={styles.forecast}>
                <AppIcon
                  name="alert-outline"
                  size={18}
                  color={theme.colors.warning}
                />
                <Text style={styles.forecastText}>
                  {budgetForecast.message}
                </Text>
              </View>
            )}
            <View style={ui.row}>
              <View style={styles.flex}>
                <ActionLink
                  label="Chỉnh sửa"
                  icon="pencil-outline"
                  onPress={() => start(budget)}
                />
              </View>
              <View style={styles.flex}>
                <ActionLink
                  danger
                  label="Xóa"
                  icon="trash-can-outline"
                  onPress={() =>
                    Alert.alert('Xóa ngân sách?', undefined, [
                      { text: 'Hủy' },
                      {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: () => remove.mutate(budget.id),
                      },
                    ])
                  }
                />
              </View>
            </View>
          </EntityCard>
        );
      })}
      <Sheet
        visible={open}
        title={editing ? 'Chỉnh sửa ngân sách' : 'Tạo ngân sách'}
        onClose={() => setOpen(false)}
      >
        <Field
          label="Hạn mức"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Text style={ui.muted}>Danh mục chi</Text>
        <ChoiceChips
          value={categoryId}
          options={[
            { label: 'Tổng chi tiêu', value: '' },
            ...(categories.data || [])
              .filter((item) => item.type === 'EXPENSE')
              .map((item) => ({ label: item.name, value: item.id })),
          ]}
          onChange={setCategoryId}
        />
        <Button
          label="Lưu ngân sách"
          loading={save.isPending}
          disabled={Number(amount) <= 0}
          onPress={() => save.mutate()}
        />
      </Sheet>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    heroAction: {
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.onBrand,
    },
    heroActionText: {
      color: theme.colors.primaryStrong,
      fontSize: 14,
      fontWeight: '900',
    },
    period: {
      marginTop: 17,
      minHeight: 54,
      paddingHorizontal: 11,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,.18)',
    },
    periodLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    periodText: {
      color: theme.colors.onBrand,
      fontSize: 17,
      fontWeight: '900',
    },
    metrics: { flexDirection: 'row', gap: 8 },
    budgetNumbers: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    spent: {
      marginTop: 3,
      color: theme.colors.text,
      fontSize: 19,
      fontWeight: '900',
    },
    percentCircle: {
      width: 61,
      height: 61,
      borderRadius: 31,
      borderWidth: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    percentText: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
    forecast: {
      minHeight: 48,
      paddingHorizontal: 11,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.warningSoft,
    },
    forecastText: {
      flex: 1,
      color: theme.colors.warningStrong,
      fontSize: 12,
      fontWeight: '700',
    },
  });
