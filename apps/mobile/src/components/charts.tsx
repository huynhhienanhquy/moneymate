import { Text } from '@/components/design-text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

/**
 * Render the bar chart interface.
 *
 * Use it to keep the charts workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered bar chart interface.
 */
export function BarChart({
  data,
  highlightLast = false,
}: {
  data: { label: string; income: number; expense: number }[];
  highlightLast?: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const max = Math.max(
    1,
    ...data.flatMap((item) => [Number(item.income), Number(item.expense)]),
  );
  return (
    <View style={styles.chart}>
      {data.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.column,
            highlightLast &&
              index === data.length - 1 && {
                backgroundColor: theme.colors.surfaceRaised,
              },
          ]}
        >
          <View style={styles.bars}>
            <View
              style={[
                styles.bar,
                styles.income,
                { height: Math.max(3, (Number(item.income) / max) * 120) },
              ]}
            />
            <View
              style={[
                styles.bar,
                styles.expense,
                { height: Math.max(3, (Number(item.expense) / max) * 120) },
              ]}
            />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Create theme-aware style definitions for the charts interface.
 *
 * Use it to keep the charts workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
export function SavingsChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const { theme } = useAppTheme();
  const max = Math.max(1, ...data.map((item) => Math.abs(item.value))) * 1.3;
  const positiveHeight = 146;
  const negativeHeight = data.some((item) => item.value < 0) ? 48 : 0;
  return (
    <View style={{ marginTop: 20 }}>
      <View
        style={{
          height: positiveHeight + negativeHeight + 30,
          marginLeft: 40,
          marginRight: 10,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (i * positiveHeight) / 3,
              borderTopWidth: 1,
              borderStyle: i === 3 ? 'solid' : 'dotted',
              borderColor: i === 3 ? '#C3C6D7' : theme.colors.neutralSoft,
            }}
          >
            <Text
              style={{
                position: 'absolute',
                right: '100%',
                width: 40,
                top: -10,
                color: theme.colors.subtle,
                fontSize: 11,
              }}
            >
              {i === 3 ? '0đ' : `${((max * (3 - i)) / 3 / 1000).toFixed(1)}k`}
            </Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', height: '100%' }}>
          {data.map((item) => {
            const height = Math.max(
              2,
              (Math.abs(item.value) / max) * positiveHeight,
            );
            const positive = item.value >= 0;
            const color = positive ? theme.colors.primary : theme.colors.danger;
            return (
              <View key={item.label} style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    position: 'absolute',
                    top: positive
                      ? positiveHeight - height - 23
                      : positiveHeight - 23,
                    color,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {positive ? '+' : ''}
                  {Math.round(item.value).toLocaleString('vi-VN')}
                </Text>
                <View
                  style={{
                    position: 'absolute',
                    top: positive ? positiveHeight - height : positiveHeight,
                    height: positive
                      ? height
                      : Math.min(negativeHeight, height),
                    width: '65%',
                    maxWidth: 56,
                    borderRadius: 5,
                    backgroundColor: color,
                  }}
                />
                <Text
                  style={{
                    position: 'absolute',
                    top: positiveHeight + negativeHeight + 7,
                    fontSize: 13,
                    color: theme.colors.muted,
                    fontWeight: '500',
                  }}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View
        style={{
          marginTop: 26,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {[
          { color: theme.colors.primary, label: 'Dương (Tiết kiệm)' },
          { color: theme.colors.danger, label: 'Âm (Thâm hụt)' },
        ].map((item) => (
          <View
            key={item.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: item.color,
              }}
            />
            <Text style={{ fontSize: 14, color: theme.colors.muted }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    chart: {
      height: theme.sizes.chart,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      paddingTop: theme.spacing.sm + 2,
    },
    column: {
      flex: 1,
      alignItems: 'center',
      gap: 9,
      paddingVertical: 8,
      borderRadius: 12,
    },
    bars: {
      height: 124,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.xs - 1,
    },
    bar: { width: 12, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
    income: { backgroundColor: theme.colors.success },
    expense: { backgroundColor: theme.colors.danger },
    label: {
      color: theme.colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
  });
