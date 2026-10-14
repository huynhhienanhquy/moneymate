import {
  Ring,
  SummaryTile,
  SectionHeading,
  categoryAppearance,
} from '@/components/design';
import { Text } from '@/components/design-text';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import {
  Button,
  ChoiceChips,
  EmptyState,
  Field,
  PageHero,
  ProgressBar,
  Screen,
  Sheet,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { money } from '@/components/finance';
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

/**
 * Render the budgets page interface.
 *
 * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered budgets page interface.
 */
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
    /**
     * Load budgets page data for the query cache.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting budgets page value for the caller.
     */
    queryFn: () => apiRequest<Budget[]>(`/budgets?month=${month}&year=${year}`),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    /**
     * Load budgets page data for the query cache.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting budgets page value for the caller.
     */
    queryFn: () => apiRequest<Category[]>('/categories'),
  });
  const forecast = useQuery({
    queryKey: ['ai-forecast', month, year],
    /**
     * Load budgets page data for the query cache.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting budgets page value for the caller.
     */
    queryFn: () =>
      apiRequest<BudgetForecast>(
        `/ai/budget/forecast?month=${month}&year=${year}`,
      ),
    staleTime: 120_000,
  });
  const save = useMutation({
    /**
     * Execute the budgets page mutation requested by the client.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting budgets page value for the caller.
     */
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
    /**
     * Finalize the budgets page workflow after a successful operation.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns Nothing; the operation is complete when the function returns.
     */
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['budgets'] });
      setOpen(false);
    },
    /**
     * Map a failed budgets page operation into user-visible state.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @param error - The failure value to classify, report, or propagate.
     * @returns The resulting budgets page value for the caller.
     */
    onError: (error) =>
      Alert.alert(
        'Không thể lưu ngân sách',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  const remove = useMutation({
    /**
     * Execute the budgets page mutation requested by the client.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting budgets page value for the caller.
     */
    mutationFn: (id: string) =>
      apiRequest(`/budgets/${id}`, { method: 'DELETE' }),
    /**
     * Finalize the budgets page workflow after a successful operation.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting budgets page value for the caller.
     */
    onSuccess: () => client.invalidateQueries({ queryKey: ['budgets'] }),
    /**
     * Map a failed budgets page operation into user-visible state.
     *
     * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
     * @param error - The failure value to classify, report, or propagate.
     * @returns The resulting budgets page value for the caller.
     */
    onError: (error) =>
      Alert.alert(
        'Không thể xóa ngân sách',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      ),
  });
  /**
   * Start budgets page for the budgets page workflow.
   *
   * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
   * @param budget - The budget value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
  const start = (budget?: Budget) => {
    setEditing(budget || null);
    setAmount(String(budget?.amount || ''));
    setCategoryId(budget?.category?.id || '');
    setOpen(true);
  };
  /**
   * Shift month within the budgets page reporting range.
   *
   * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
   * @param step - The step value required by the operation.
   * @returns Nothing; the operation is complete when the function returns.
   */
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
    <Screen title="Ngân sách" gutter={25}>
      <PageHero
        eyebrow="Quản lý Ngân sách"
        eyebrowLarge
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
          <SummaryTile
            compact
            label="Tổng hạn mức"
            value={money(total)}
            caption={budgets.length + ' mục'}
          />
          <SummaryTile
            compact
            label="Đã chi"
            value={money(spent)}
            color={theme.colors.danger}
            caption={
              Math.round((spent / Math.max(total, 1)) * 100) + '% mức chi'
            }
          />
          <SummaryTile
            compact
            label="Còn lại"
            value={money(remaining)}
            color={theme.colors.success}
            caption={
              'Tốt • ' +
              Math.round((remaining / Math.max(total, 1)) * 100) +
              '%'
            }
          />
        </View>
      )}
      <SectionHeading
        style={{ marginTop: -5, marginBottom: -10, minHeight: 30 }}
        title="Danh sách ngân sách"
        caption={budgets.length + ' hạng mục'}
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
          (Number(budget.spent || 0) / Math.max(Number(budget.amount), 1)) *
            100;
        const warning = rawPercent >= 75;
        const color = warning
          ? theme.colors.danger
          : rawPercent <= 30
            ? theme.colors.success
            : theme.colors.primaryStrong;
        const appearance = categoryAppearance(budget.category?.name);
        const left = Number(budget.amount) - Number(budget.spent || 0);
        const notice = forecastMap.get(budget.categoryId || 'global');
        return (
          <View key={budget.id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View
                style={[
                  styles.categoryTile,
                  {
                    backgroundColor: warning
                      ? theme.colors.dangerSoft
                      : rawPercent <= 30
                        ? theme.colors.successSoft
                        : theme.colors.primarySoft,
                  },
                ]}
              >
                <AppIcon name={appearance.icon} size={25} color={color} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.budgetTitle}>
                  {budget.category?.name || 'Tổng ngân sách'}
                </Text>
                <Text style={ui.muted}>
                  {budget.category?.name === 'Di chuyển'
                    ? 'Xăng xe, Grab, gửi xe'
                    : budget.category?.name === 'Ăn uống'
                      ? 'Cà phê, ăn trưa, siêu thị'
                      : budget.category?.name === 'Mua sắm'
                        ? 'Quần áo, đồ gia dụng'
                        : 'Theo dõi chi tiêu trong tháng'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: warning
                      ? theme.colors.dangerSoft
                      : rawPercent <= 30
                        ? theme.colors.successSoft
                        : theme.colors.primarySoft,
                  },
                ]}
              >
                <AppIcon
                  name={
                    warning
                      ? 'alert-outline'
                      : rawPercent <= 30
                        ? 'check-circle-outline'
                        : 'shield-check-outline'
                  }
                  size={15}
                  color={color}
                />
                <Text style={{ color, fontSize: 13, fontWeight: '500' }}>
                  {rawPercent >= 100
                    ? 'Vượt mức'
                    : warning
                      ? 'Cảnh báo'
                      : rawPercent <= 30
                        ? 'Tốt'
                        : 'An toàn'}
                </Text>
              </View>
            </View>
            <View style={styles.budgetNumbers}>
              <View style={styles.flex}>
                <Text style={ui.muted}>
                  Đã chi:{' '}
                  <Text style={[styles.spent, { color }]}>
                    {money(budget.spent || 0)}
                  </Text>{' '}
                  / {money(budget.amount)}
                </Text>
                <Text style={[ui.muted, { marginTop: 8 }]}>
                  Còn lại:{' '}
                  <Text style={{ color, fontWeight: '600' }}>
                    {money(left)} ({Math.round(100 - rawPercent)}%)
                  </Text>
                </Text>
              </View>
              <Ring
                size={65}
                width={7}
                segments={[{ value: Math.min(1, rawPercent / 100), color }]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: warning ? color : theme.colors.text,
                  }}
                >
                  {Math.round(rawPercent)}%
                </Text>
              </Ring>
            </View>
            {notice && notice.severity !== 'OK' && (
              <Text style={{ color, fontSize: 12 }}>{notice.message}</Text>
            )}
            <View style={styles.budgetFooter}>
              <View style={styles.flex}>
                <ProgressBar
                  value={rawPercent}
                  tone={
                    warning
                      ? 'danger'
                      : rawPercent <= 30
                        ? 'success'
                        : 'primary'
                  }
                />
              </View>
              <Pressable
                accessibilityLabel={
                  'Tùy chọn ' + (budget.category?.name || 'ngân sách')
                }
                style={styles.moreButton}
                onPress={() =>
                  Alert.alert('Ngân sách', undefined, [
                    { text: 'Chỉnh sửa', onPress: () => start(budget) },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => remove.mutate(budget.id),
                    },
                    { text: 'Hủy', style: 'cancel' },
                  ])
                }
              >
                <AppIcon
                  name="dots-vertical"
                  size={20}
                  color={theme.colors.primaryStrong}
                />
              </Pressable>
            </View>
          </View>
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

/**
 * Create theme-aware style definitions for the budgets page interface.
 *
 * Use it to keep the budgets page workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    budgetCard: {
      minHeight: 235,
      borderRadius: 16,
      padding: 20,
      gap: 20,
      backgroundColor: theme.colors.surface,
      boxShadow: '0px 2px 2px rgba(19,27,46,.035)',
    },
    budgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    categoryTile: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    budgetTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 3,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    budgetFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    moreButton: {
      width: 35,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAction: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.onBrand,
    },
    heroActionText: {
      color: theme.colors.primaryStrong,
      fontSize: 16,
      fontWeight: '700',
    },
    period: {
      marginTop: 10,
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
      fontWeight: '700',
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
      fontWeight: '700',
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
    percentText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
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
