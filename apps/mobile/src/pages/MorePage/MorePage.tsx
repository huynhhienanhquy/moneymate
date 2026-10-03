import { useMemo } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { Screen } from '@/components/ui';
import { useAppTheme, type AppTheme } from '@/theme';

type MenuItem = {
  href: Href;
  label: string;
  icon: AppIconName;
  pro?: boolean;
  sectionStart?: boolean;
};

const items: MenuItem[] = [
  { href: '/(tabs)', label: 'Tổng quan', icon: 'view-grid-outline' },
  { href: '/wallets', label: 'Ví tài khoản', icon: 'wallet-outline' },
  {
    href: '/(tabs)/transactions',
    label: 'Giao dịch',
    icon: 'receipt-text-outline',
  },
  { href: '/categories', label: 'Danh mục', icon: 'tag-outline' },
  { href: '/(tabs)/budgets', label: 'Ngân sách', icon: 'piggy-bank-outline' },
  {
    href: '/saving-goals',
    label: 'Mục tiêu',
    icon: 'bullseye-arrow',
    sectionStart: true,
  },
  { href: '/recurring', label: 'Định kỳ', icon: 'sync' },
  { href: '/reports', label: 'Báo cáo', icon: 'chart-bar' },
  {
    href: '/monthly-balance',
    label: 'Tiết kiệm tháng',
    icon: 'wallet-plus-outline',
  },
  {
    href: '/(tabs)/advisor',
    label: 'AI Tài chính',
    icon: 'creation',
    pro: true,
    sectionStart: true,
  },
  { href: '/(tabs)/profile', label: 'Hồ sơ', icon: 'account-outline' },
];

export default function MorePage() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  return (
    <Screen title="Thêm" showTopBar={false} bottomNav={false} decorated={false}>
      <View style={styles.menu}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.item,
              item.sectionStart && styles.sectionStart,
              item.pro && styles.proItem,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon
              name={item.icon}
              size={24}
              color={item.pro ? theme.colors.primary : theme.colors.muted}
            />
            <Text style={[styles.label, item.pro && styles.proLabel]}>
              {item.label}
            </Text>
            {item.pro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    menu: {
      marginHorizontal: -theme.sizes.screenGutter,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    item: {
      minHeight: 60,
      paddingHorizontal: theme.spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    sectionStart: { marginTop: theme.spacing.sm + 3 },
    proItem: {
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.md,
      paddingHorizontal: theme.spacing.md - 2,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primarySoft,
    },
    label: {
      flex: 1,
      color: theme.colors.muted,
      fontSize: theme.typography.body + 1,
      fontWeight: '700',
    },
    proLabel: { color: theme.colors.primaryStrong, fontWeight: '900' },
    proBadge: {
      minWidth: 48,
      height: 30,
      paddingHorizontal: theme.spacing.sm + 2,
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark ? theme.colors.primaryBorder : '#CFD9FF',
    },
    proBadgeText: {
      color: theme.colors.primary,
      fontSize: theme.typography.caption,
      fontWeight: '900',
    },
    pressed: { opacity: 0.62 },
  });
