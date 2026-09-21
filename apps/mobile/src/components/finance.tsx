import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, useUiStyles } from './ui';
import { useAppTheme, type AppTheme } from '@/theme';

export const money = (value: number | string = 0) => Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export function IconTile({ name, color, background }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color?: string; background?: string }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={[styles.icon, { backgroundColor: background || theme.colors.primarySoft }]}><MaterialCommunityIcons name={name} size={theme.sizes.icon} color={color || theme.colors.primary} /></View>;
}

export function EntityCard({ icon, title, subtitle, value, badge, onPress, children }: PropsWithChildren<{ icon: ReactNode; title: string; subtitle?: string; value?: string; badge?: ReactNode; onPress?: () => void }>) {
  const { theme } = useAppTheme(); const ui = useUiStyles(); const styles = useMemo(() => createStyles(theme), [theme]);
  const body = <Card><View style={ui.between}><View style={[ui.row, { flex: 1 }]}>{icon}<View style={{ flex: 1 }}><View style={styles.titleRow}><Text numberOfLines={1} style={ui.text}>{title}</Text>{badge}</View>{subtitle && <Text numberOfLines={2} style={ui.muted}>{subtitle}</Text>}</View></View>{value && <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>{value}</Text>}</View>{children}</Card>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{body}</Pressable> : body;
}

export function ActionLink({ label, icon, onPress, danger }: { label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; onPress: () => void; danger?: boolean }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}><MaterialCommunityIcons name={icon} size={18} color={danger ? theme.colors.danger : theme.colors.primary} /><Text style={[styles.actionText, danger && { color: theme.colors.danger }]}>{label}</Text></Pressable>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  icon: { width: theme.touchTarget, height: theme.touchTarget, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm - 1 },
  value: { color: theme.colors.text, fontSize: theme.typography.body, fontWeight: '900', maxWidth: 135 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm - 1, minHeight: theme.touchTarget, paddingHorizontal: theme.spacing.sm + 2 },
  actionText: { color: theme.colors.primaryStrong, fontSize: theme.typography.bodySmall, fontWeight: '800' }
});
