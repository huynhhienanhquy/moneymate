import { Text } from '@/components/design-text';
import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { Card, useUiStyles } from './ui';
import { useAppTheme, type AppTheme } from '@/theme';

/**
 * Format a monetary amount for display in Vietnamese dong.
 *
 * Use it to keep the finance workflow's presentation and interactions in one reusable UI boundary.
 * @param value - The value to transform or evaluate.
 * @returns The resulting finance value for the caller.
 */
export const money = (value: number | string = 0) =>
  Number(value).toLocaleString('vi-VN', {
    maximumFractionDigits: 0,
  }) + ' đ';

/**
 * Render the icon tile interface.
 *
 * Use it to keep the finance workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered icon tile interface.
 */
export function IconTile({
  name,
  color,
  background,
}: {
  name: AppIconName;
  color?: string;
  background?: string;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.icon,
        { backgroundColor: background || theme.colors.primarySoft },
      ]}
    >
      <AppIcon name={name} size={25} color={color || theme.colors.primary} />
    </View>
  );
}

/**
 * Render the entity card interface.
 *
 * Use it to keep the finance workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered entity card interface.
 */
export function EntityCard({
  icon,
  title,
  subtitle,
  value,
  badge,
  trailing,
  onPress,
  children,
}: PropsWithChildren<{
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  badge?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
}>) {
  const { theme } = useAppTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const body = (
    <Card>
      <View style={ui.between}>
        <View style={[ui.row, { flex: 1 }]}>
          {icon}
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={ui.text}>
                {title}
              </Text>
              {badge}
            </View>
            {subtitle && (
              <Text numberOfLines={2} style={ui.muted}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {trailing ||
          (value ? (
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
              {value}
            </Text>
          ) : null)}
      </View>
      {children}
    </Card>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/**
 * Render the action link interface.
 *
 * Use it to keep the finance workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered action link interface.
 */
export function ActionLink({
  label,
  icon,
  onPress,
  danger,
}: {
  label: string;
  icon: AppIconName;
  onPress: () => void;
  danger?: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <AppIcon
        name={icon}
        size={18}
        color={danger ? theme.colors.danger : theme.colors.primary}
      />
      <Text
        style={[styles.actionText, danger && { color: theme.colors.danger }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Create theme-aware style definitions for the finance interface.
 *
 * Use it to keep the finance workflow's presentation and interactions in one reusable UI boundary.
 * @param theme - The theme value required by the operation.
 * @returns The style map derived from the active theme.
 */
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    icon: {
      width: 50,
      height: 50,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm - 1,
    },
    value: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: '700',
      maxWidth: 135,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm - 1,
      minHeight: theme.touchTarget,
      paddingHorizontal: theme.spacing.sm + 2,
    },
    actionText: {
      color: theme.colors.primaryStrong,
      fontSize: theme.typography.bodySmall,
      fontWeight: '800',
    },
  });
