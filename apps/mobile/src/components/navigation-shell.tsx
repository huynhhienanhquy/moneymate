import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, type Href } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useAppTheme, type AppTheme } from '@/theme';
import { APP_IMAGES } from '@/lib/app-images';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  path?: string;
}
interface NotificationResult {
  notifications: NotificationItem[];
  unreadCount: number;
}

const menu = [
  { label: 'Tổng quan', href: '/(tabs)', icon: 'view-dashboard-outline' },
  { label: 'Ví tài khoản', href: '/wallets', icon: 'wallet-outline' },
  {
    label: 'Giao dịch',
    href: '/(tabs)/transactions',
    icon: 'receipt-text-outline',
  },
  { label: 'Danh mục', href: '/categories', icon: 'tag-multiple-outline' },
  { label: 'Ngân sách', href: '/(tabs)/budgets', icon: 'piggy-bank-outline' },
  { label: 'Mục tiêu', href: '/saving-goals', icon: 'target' },
  { label: 'Định kỳ', href: '/recurring', icon: 'calendar-sync-outline' },
  { label: 'Báo cáo', href: '/reports', icon: 'chart-bar' },
  {
    label: 'Tiết kiệm tháng',
    href: '/monthly-balance',
    icon: 'wallet-plus-outline',
  },
  { label: 'AI Tài chính', href: '/(tabs)/advisor', icon: 'creation' },
  { label: 'Hồ sơ', href: '/(tabs)/profile', icon: 'account-outline' },
  {
    label: 'Quản trị',
    href: '/admin',
    icon: 'shield-account-outline',
    adminOnly: true,
  },
] as const;

export function MobileTopBar({ title }: { title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [drawer, setDrawer] = useState(false);
  const [panel, setPanel] = useState(false);
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<NotificationResult>('/notifications?take=20'),
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () =>
      apiRequest('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const items = notifications.data?.notifications || [];
  const unread =
    notifications.data?.unreadCount ??
    items.filter((item) => !item.isRead).length;
  const visibleMenu = menu.filter(
    (item) =>
      !('adminOnly' in item) || !item.adminOnly || user?.role === 'ADMIN',
  );
  const go = (href: string) => {
    setDrawer(false);
    router.push(href as Href);
  };
  const isActive = (href: string) =>
    href === '/(tabs)'
      ? pathname === '/' || pathname === '/(tabs)'
      : pathname.includes(href.replace('/(tabs)', ''));
  const openNotification = (item: NotificationItem) => {
    if (!item.isRead) markRead.mutate(item.id);
    setPanel(false);
    if (item.path?.startsWith('/') && !item.path.startsWith('//'))
      router.push(item.path as Href);
  };
  const handleLogout = () => {
    setDrawer(false);
    void logout();
  };
  return (
    <>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở menu"
          style={styles.logoButton}
          onPress={() => setDrawer(true)}
        >
          <Image
            source={APP_IMAGES.logo}
            accessibilityLabel="Logo MoneyMate"
            contentFit="cover"
            style={styles.logo}
          />
        </Pressable>
        <Text style={styles.wordmark}>MoneyMate</Text>
        <View style={styles.divider} />
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${unread} thông báo chưa đọc`}
            style={styles.iconButton}
            onPress={() => setPanel(true)}
          >
            <AppIcon name="bell-outline" size={24} color={theme.colors.muted} />
            {unread > 0 && <View style={styles.notificationDot} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở hồ sơ"
            onPress={() => router.push('/(tabs)/profile' as Href)}
          >
            <LinearGradient
              colors={theme.gradients.brand}
              style={styles.avatar}
            >
              <AppIcon
                name="account-outline"
                size={22}
                color={theme.colors.onBrand}
              />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
      <Modal
        visible={drawer}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawer(false)}
      >
        <View style={styles.modal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDrawer(false)}
          />
          <View style={styles.drawer}>
            <View style={styles.brand}>
              <Image
                source={APP_IMAGES.logo}
                accessibilityLabel="Logo MoneyMate"
                contentFit="cover"
                style={styles.brandLogo}
              />
              <View style={styles.flex}>
                <Text style={styles.brandName}>MoneyMate</Text>
                <Text style={styles.brandCaption}>SMART FINANCE</Text>
              </View>
              <Pressable
                accessibilityLabel="Đóng menu"
                style={styles.iconButton}
                onPress={() => setDrawer(false)}
              >
                <AppIcon
                  name="close"
                  size={theme.sizes.icon}
                  color={theme.colors.muted}
                />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.menu}>
              {visibleMenu.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.href}
                  onPress={() => go(item.href)}
                  style={[
                    styles.menuItem,
                    isActive(item.href) && styles.menuActive,
                  ]}
                >
                  <AppIcon
                    name={item.icon}
                    size={theme.sizes.icon}
                    color={
                      isActive(item.href)
                        ? theme.colors.onBrand
                        : theme.colors.muted
                    }
                  />
                  <Text
                    style={[
                      styles.menuText,
                      isActive(item.href) && styles.menuTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.account}>
              <View style={styles.userRow}>
                <LinearGradient
                  colors={theme.gradients.brand}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {user?.fullName?.[0]?.toUpperCase() || 'M'}
                  </Text>
                </LinearGradient>
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={styles.userName}>
                    {user?.fullName}
                  </Text>
                  <Text numberOfLines={1} style={styles.userEmail}>
                    {user?.email}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  theme.dark
                    ? 'Chuyển sang giao diện sáng'
                    : 'Chuyển sang giao diện tối'
                }
                style={styles.themeButton}
                onPress={toggleTheme}
              >
                <AppIcon
                  name={theme.dark ? 'white-balance-sunny' : 'weather-night'}
                  size={theme.sizes.iconSmall}
                  color={
                    theme.dark ? theme.colors.warning : theme.colors.primary
                  }
                />
                <Text style={styles.themeText}>
                  {theme.dark ? 'Giao diện sáng' : 'Giao diện tối'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đăng xuất"
                style={styles.logout}
                onPress={handleLogout}
              >
                <AppIcon name="logout" size={20} color={theme.colors.danger} />
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={panel}
        transparent
        animationType="slide"
        onRequestClose={() => setPanel(false)}
      >
        <View style={styles.modalBottom}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPanel(false)}
          />
          <View style={styles.panel}>
            <View style={styles.handle} />
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Thông báo</Text>
                <Text style={styles.panelCaption}>{unread} chưa đọc</Text>
              </View>
              {unread > 0 && (
                <Pressable onPress={() => markAll.mutate()}>
                  <Text style={styles.readAll}>Đọc tất cả</Text>
                </Pressable>
              )}
            </View>
            <ScrollView contentContainerStyle={styles.notificationList}>
              {notifications.isLoading && (
                <Text style={styles.empty}>Đang tải thông báo…</Text>
              )}
              {notifications.isError && (
                <Text style={styles.error}>Không thể tải thông báo.</Text>
              )}
              {!notifications.isLoading &&
                !notifications.isError &&
                !items.length && (
                  <Text style={styles.empty}>Không có thông báo</Text>
                )}
              {items.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => openNotification(item)}
                  style={[styles.notification, !item.isRead && styles.unread]}
                >
                  <View style={styles.flex}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.notificationMessage}>
                      {item.message}
                    </Text>
                    <Text style={styles.notificationDate}>
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Xóa thông báo"
                    onPress={() => remove.mutate(item.id)}
                  >
                    <AppIcon
                      name="trash-can-outline"
                      size={theme.sizes.iconSmall}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.allButton}
              onPress={() => {
                setPanel(false);
                router.push('/notifications' as Href);
              }}
            >
              <Text style={styles.allButtonText}>Xem tất cả thông báo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const bottomItems = [
  {
    label: 'Tổng quan',
    href: '/(tabs)',
    icon: 'view-dashboard-outline',
    activeIcon: 'view-dashboard',
  },
  {
    label: 'Ví',
    href: '/wallets',
    icon: 'wallet-outline',
    activeIcon: 'wallet',
  },
  {
    label: 'Ngân sách',
    href: '/(tabs)/budgets',
    icon: 'piggy-bank-outline',
    activeIcon: 'piggy-bank',
  },
  {
    label: 'Thêm',
    href: '/(tabs)/more',
    icon: 'view-grid-outline',
    activeIcon: 'view-grid',
  },
] as const;

export function MobileBottomBar() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const moreRoutes = [
    '/more',
    '/categories',
    '/saving-goals',
    '/recurring',
    '/reports',
    '/monthly-balance',
    '/notifications',
    '/profile',
    '/admin',
  ];
  const active = (href: string) => {
    if (href === '/(tabs)')
      return (
        pathname === '/' || pathname === '/(tabs)' || pathname === '/index'
      );
    if (href === '/(tabs)/more')
      return moreRoutes.some((route) => pathname.includes(route));
    return pathname.includes(href.replace('/(tabs)', ''));
  };
  return (
    <View
      style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 7) }]}
    >
      {bottomItems.slice(0, 2).map((item) => (
        <Pressable
          key={item.href}
          accessibilityRole="button"
          accessibilityState={{ selected: active(item.href) }}
          onPress={() => router.navigate(item.href as Href)}
          style={styles.bottomItem}
        >
          <AppIcon
            name={active(item.href) ? item.activeIcon : item.icon}
            size={24}
            color={
              active(item.href) ? theme.colors.primary : theme.colors.muted
            }
          />
          <Text
            style={[
              styles.bottomLabel,
              active(item.href) && styles.bottomLabelActive,
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
      <View style={styles.addSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quét hóa đơn"
          onPress={() => router.push('/scan-receipt' as Href)}
          style={({ pressed }) => [styles.addFab, pressed && { opacity: 0.76 }]}
        >
          <AppIcon name="plus" size={34} color={theme.colors.onBrand} />
        </Pressable>
      </View>
      {bottomItems.slice(2).map((item) => (
        <Pressable
          key={item.href}
          accessibilityRole="button"
          accessibilityState={{ selected: active(item.href) }}
          onPress={() => router.navigate(item.href as Href)}
          style={styles.bottomItem}
        >
          <AppIcon
            name={active(item.href) ? item.activeIcon : item.icon}
            size={24}
            color={
              active(item.href) ? theme.colors.primary : theme.colors.muted
            }
          />
          <Text
            style={[
              styles.bottomLabel,
              active(item.href) && styles.bottomLabelActive,
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    topbar: {
      minHeight: theme.sizes.topbar + 4,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? theme.colors.border : '#ECECF4',
    },
    logoButton: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
    logo: { width: 40, height: 40 },
    wordmark: {
      marginLeft: 8,
      color: theme.colors.text,
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    divider: {
      width: 2,
      height: 25,
      marginHorizontal: 10,
      backgroundColor: theme.dark ? theme.colors.borderStrong : '#D9DBE8',
    },
    iconButton: {
      width: theme.touchTarget,
      height: theme.touchTarget,
      borderRadius: theme.radius.md - 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: '800',
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: theme.colors.onBrand, fontWeight: '900' },
    count: {
      position: 'absolute',
      right: 3,
      top: 3,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 3,
      borderRadius: theme.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.danger,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    countText: {
      color: theme.colors.onBrand,
      fontSize: theme.typography.caption - 2,
      fontWeight: '900',
    },
    notificationDot: {
      position: 'absolute',
      right: 8,
      top: 7,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#DC3152',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      minHeight: 74,
      paddingTop: 7,
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.dark ? theme.colors.border : '#ECECF4',
      shadowColor: theme.colors.shadow,
      shadowOpacity: theme.dark ? 0.3 : 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: -5 },
      elevation: 16,
      zIndex: 90,
    },
    bottomItem: {
      flex: 1,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    bottomLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700' },
    bottomLabelActive: { color: theme.colors.primary, fontWeight: '900' },
    addSlot: { flex: 1, alignItems: 'center' },
    addFab: {
      width: 60,
      height: 60,
      marginTop: -24,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 5,
      borderColor: theme.colors.background,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.34,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 12,
    },
    modal: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      flexDirection: 'row',
    },
    drawer: {
      width: '84%',
      maxWidth: theme.sizes.drawerMax,
      height: '100%',
      backgroundColor: theme.colors.background,
      paddingTop: 50,
      paddingHorizontal: theme.spacing.sm + 6,
      paddingBottom: theme.spacing.lg - 2,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 22,
      elevation: 20,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 3,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.sm + 2,
    },
    brandLogo: { width: 45, height: 45, borderRadius: theme.radius.md },
    brandName: {
      color: theme.colors.text,
      fontSize: theme.typography.heading - 1,
      fontWeight: '900',
    },
    brandCaption: {
      color: theme.colors.subtle,
      fontSize: theme.typography.caption - 2,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    menu: { gap: theme.spacing.xs + 1, paddingVertical: theme.spacing.xs + 1 },
    menuItem: {
      minHeight: theme.touchTarget + 5,
      borderRadius: theme.radius.md + 1,
      paddingHorizontal: theme.spacing.md - 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 5,
    },
    menuActive: { backgroundColor: theme.colors.primary },
    menuText: {
      color: theme.colors.muted,
      fontSize: theme.typography.bodySmall + 1,
      fontWeight: '700',
    },
    menuTextActive: { color: theme.colors.onBrand },
    account: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm + 6,
      gap: theme.spacing.sm + theme.spacing.xs,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 3,
    },
    userName: { color: theme.colors.text, fontWeight: '800' },
    userEmail: {
      color: theme.colors.muted,
      fontSize: theme.typography.caption,
    },
    themeButton: {
      minHeight: theme.touchTarget,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm + 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 3,
      backgroundColor: theme.colors.neutralSoft,
    },
    themeText: { color: theme.colors.text, fontWeight: '700' },
    logout: {
      minHeight: theme.touchTarget + 2,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm + 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + 3,
      backgroundColor: theme.colors.dangerSoft,
    },
    logoutText: { color: theme.colors.danger, fontWeight: '800' },
    modalBottom: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
    },
    panel: {
      maxHeight: '78%',
      minHeight: 320,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.md + 1,
      paddingBottom: theme.spacing.lg + 2,
    },
    handle: {
      width: theme.sizes.sheetHandle,
      height: 5,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.borderStrong,
      alignSelf: 'center',
      marginVertical: theme.spacing.sm + 2,
    },
    panelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: theme.spacing.sm + 5,
    },
    panelTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: '900',
    },
    panelCaption: {
      color: theme.colors.muted,
      fontSize: theme.typography.bodySmall - 1,
    },
    readAll: { color: theme.colors.primaryStrong, fontWeight: '800' },
    notificationList: { gap: theme.spacing.sm },
    notification: {
      flexDirection: 'row',
      gap: theme.spacing.sm + 2,
      padding: theme.spacing.sm + 5,
      borderRadius: theme.radius.md + 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    unread: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    notificationTitle: {
      color: theme.colors.text,
      fontWeight: '800',
      fontSize: theme.typography.bodySmall,
    },
    notificationMessage: {
      color: theme.colors.muted,
      fontSize: theme.typography.bodySmall - 1,
      lineHeight: 17,
      marginTop: 3,
    },
    notificationDate: {
      color: theme.colors.subtle,
      fontSize: theme.typography.caption - 1,
      marginTop: 5,
    },
    empty: {
      color: theme.colors.muted,
      textAlign: 'center',
      paddingVertical: theme.spacing.xl + 3,
    },
    error: {
      color: theme.colors.danger,
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
    },
    allButton: {
      minHeight: theme.touchTarget + 4,
      marginTop: theme.spacing.sm + 4,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    allButtonText: { color: theme.colors.primaryStrong, fontWeight: '800' },
  });
