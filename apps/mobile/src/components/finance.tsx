import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, ui } from './ui';
import { theme } from '@/theme';

export const money = (value: number | string = 0) => Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export function IconTile({ name, color = theme.colors.primary, background = theme.colors.primarySoft }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color?: string; background?: string }) {
  return <View style={[styles.icon, { backgroundColor: background }]}><MaterialCommunityIcons name={name} size={21} color={color} /></View>;
}

export function EntityCard({ icon, title, subtitle, value, badge, onPress, children }: PropsWithChildren<{ icon: ReactNode; title: string; subtitle?: string; value?: string; badge?: ReactNode; onPress?: () => void }>) {
  const body = <Card><View style={ui.between}><View style={[ui.row, { flex: 1 }]}>{icon}<View style={{ flex: 1 }}><View style={styles.titleRow}><Text numberOfLines={1} style={ui.text}>{title}</Text>{badge}</View>{subtitle && <Text numberOfLines={2} style={ui.muted}>{subtitle}</Text>}</View></View>{value && <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>{value}</Text>}</View>{children}</Card>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{body}</Pressable> : body;
}

export function ActionLink({ label, icon, onPress, danger }: { label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; onPress: () => void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}><MaterialCommunityIcons name={icon} size={18} color={danger ? theme.colors.danger : theme.colors.primary} /><Text style={[styles.actionText, danger && { color: theme.colors.danger }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  value: { color: theme.colors.text, fontSize: 15, fontWeight: '900', maxWidth: 135 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 40, paddingHorizontal: 10 },
  actionText: { color: theme.colors.primaryStrong, fontSize: 13, fontWeight: '800' }
});
