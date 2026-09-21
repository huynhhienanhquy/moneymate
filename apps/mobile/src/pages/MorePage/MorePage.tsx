import { useMemo } from 'react';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Screen, SectionTitle, useUiStyles } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';
import { useAuthStore } from '@/stores/auth.store';

const items = [
  { href: '/wallets', label: 'Ví tài khoản', caption: 'Số dư và chuyển tiền', icon: 'wallet-outline' },
  { href: '/categories', label: 'Danh mục', caption: 'Phân loại thu và chi', icon: 'shape-outline' },
  { href: '/saving-goals', label: 'Mục tiêu', caption: 'Theo dõi kế hoạch tiết kiệm', icon: 'target' },
  { href: '/recurring', label: 'Định kỳ', caption: 'Tự động hóa giao dịch', icon: 'calendar-sync-outline' },
  { href: '/reports', label: 'Báo cáo', caption: 'Xu hướng và phân tích', icon: 'chart-box-outline' },
  { href: '/monthly-balance', label: 'Tiết kiệm tháng', caption: 'Dòng tiền theo từng tháng', icon: 'chart-timeline-variant' },
  { href: '/notifications', label: 'Thông báo', caption: 'Cảnh báo và nhắc việc', icon: 'bell-outline' },
  { href: '/(tabs)/profile', label: 'Hồ sơ & bảo mật', caption: 'Tài khoản và thiết bị', icon: 'account-cog-outline' }
] as const;

export default function MorePage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const visibleItems = user?.role === 'ADMIN' ? [...items, { href: '/admin', label: 'Quản trị', caption: 'Người dùng và phân quyền', icon: 'shield-account-outline' } as const] : items;
  return <Screen title="Khám phá"><SectionTitle title="Tất cả tính năng" caption="Cùng hệ thống chức năng với MoneyMate Web" /><View style={styles.grid}>{visibleItems.map((item) => <Link key={item.href} href={item.href as Href} asChild><Pressable style={styles.item}><View style={styles.icon}><MaterialCommunityIcons name={item.icon} size={25} color={theme.colors.primary} /></View><Text style={ui.text}>{item.label}</Text><Text style={[ui.muted, styles.center]}>{item.caption}</Text></Pressable></Link>)}</View><Card><View style={ui.row}><MaterialCommunityIcons name="shield-check-outline" size={24} color={theme.colors.success} /><View style={{ flex: 1 }}><Text style={ui.text}>Dữ liệu luôn được bảo vệ</Text><Text style={ui.muted}>SecureStore, khóa sinh trắc học và đồng bộ đa thiết bị.</Text></View></View></Card></Screen>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  item: { width: '48%', minHeight: 150, padding: theme.spacing.lg, gap: theme.spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, shadowColor: theme.colors.shadow, shadowOpacity: theme.dark ? 0.18 : 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  icon: { width: theme.sizes.featureTile, height: theme.sizes.featureTile, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft },
  center: { textAlign: 'center' }
});
