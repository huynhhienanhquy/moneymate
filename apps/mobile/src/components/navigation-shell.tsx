import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, type Href } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useAppTheme, type AppTheme } from '@/theme';

interface NotificationItem { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; path?: string }
interface NotificationResult { notifications: NotificationItem[]; unreadCount: number }

const menu = [
  { label: 'Tổng quan', href: '/(tabs)', icon: 'view-dashboard-outline' },
  { label: 'Ví tài khoản', href: '/wallets', icon: 'wallet-outline' },
  { label: 'Giao dịch', href: '/(tabs)/transactions', icon: 'receipt-text-outline' },
  { label: 'Danh mục', href: '/categories', icon: 'tag-multiple-outline' },
  { label: 'Ngân sách', href: '/(tabs)/budgets', icon: 'piggy-bank-outline' },
  { label: 'Mục tiêu', href: '/saving-goals', icon: 'target' },
  { label: 'Định kỳ', href: '/recurring', icon: 'calendar-sync-outline' },
  { label: 'Báo cáo', href: '/reports', icon: 'chart-bar' },
  { label: 'Tiết kiệm tháng', href: '/monthly-balance', icon: 'wallet-plus-outline' },
  { label: 'AI Tài chính', href: '/(tabs)/advisor', icon: 'creation' },
  { label: 'Hồ sơ', href: '/(tabs)/profile', icon: 'account-outline' },
  { label: 'Quản trị', href: '/admin', icon: 'shield-account-outline', adminOnly: true },
] as const;

export function MobileTopBar({ title }: { title: string }) {
  const router = useRouter(); const pathname = usePathname(); const client = useQueryClient();
  const { user, logout } = useAuthStore(); const { theme, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [drawer, setDrawer] = useState(false); const [panel, setPanel] = useState(false);
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => apiRequest<NotificationResult>('/notifications?take=20'), refetchInterval: 60_000 });
  const markRead = useMutation({ mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAll = useMutation({ mutationFn: () => apiRequest('/notifications/read-all', { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const remove = useMutation({ mutationFn: (id: string) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const items = notifications.data?.notifications || []; const unread = notifications.data?.unreadCount ?? items.filter((item) => !item.isRead).length;
  const visibleMenu = menu.filter((item) => !('adminOnly' in item) || !item.adminOnly || user?.role === 'ADMIN');
  const go = (href: string) => { setDrawer(false); router.push(href as Href); };
  const isActive = (href: string) => href === '/(tabs)' ? pathname === '/' || pathname === '/(tabs)' : pathname.includes(href.replace('/(tabs)', ''));
  const openNotification = (item: NotificationItem) => { if (!item.isRead) markRead.mutate(item.id); setPanel(false); if (item.path?.startsWith('/') && !item.path.startsWith('//')) router.push(item.path as Href); };
  const handleLogout = () => { setDrawer(false); void logout(); };
  return <>
    <View style={styles.topbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Mở menu" style={styles.iconButton} onPress={() => setDrawer(true)}><MaterialCommunityIcons name="menu" size={25} color={theme.colors.text} /></Pressable>
      <View style={styles.topTitle}><Text style={styles.eyebrow}>MONEYMATE</Text><Text numberOfLines={1} style={styles.title}>{title}</Text></View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${unread} thông báo chưa đọc`} style={styles.iconButton} onPress={() => setPanel(true)}><MaterialCommunityIcons name="bell-outline" size={23} color={theme.colors.text} />{unread > 0 && <View style={styles.count}><Text style={styles.countText}>{unread > 9 ? '9+' : unread}</Text></View>}</Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Mở hồ sơ" onPress={() => router.push('/(tabs)/profile' as Href)}><LinearGradient colors={theme.gradients.brand} style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'M'}</Text></LinearGradient></Pressable>
      </View>
    </View>
    <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}><View style={styles.modal}><Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawer(false)} /><View style={styles.drawer}>
      <View style={styles.brand}><Image source={require('../../assets/images/moneymate-logo.png')} accessibilityLabel="Logo MoneyMate" contentFit="cover" style={styles.brandLogo} /><View style={styles.flex}><Text style={styles.brandName}>MoneyMate</Text><Text style={styles.brandCaption}>SMART FINANCE</Text></View><Pressable accessibilityLabel="Đóng menu" style={styles.iconButton} onPress={() => setDrawer(false)}><MaterialCommunityIcons name="close" size={theme.sizes.icon} color={theme.colors.muted} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.menu}>{visibleMenu.map((item) => <Pressable accessibilityRole="button" key={item.href} onPress={() => go(item.href)} style={[styles.menuItem, isActive(item.href) && styles.menuActive]}><MaterialCommunityIcons name={item.icon} size={theme.sizes.icon} color={isActive(item.href) ? theme.colors.onBrand : theme.colors.muted} /><Text style={[styles.menuText, isActive(item.href) && styles.menuTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
      <View style={styles.account}><View style={styles.userRow}><LinearGradient colors={theme.gradients.brand} style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'M'}</Text></LinearGradient><View style={styles.flex}><Text numberOfLines={1} style={styles.userName}>{user?.fullName}</Text><Text numberOfLines={1} style={styles.userEmail}>{user?.email}</Text></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel={theme.dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} style={styles.themeButton} onPress={toggleTheme}><MaterialCommunityIcons name={theme.dark ? 'white-balance-sunny' : 'weather-night'} size={theme.sizes.iconSmall} color={theme.dark ? theme.colors.warning : theme.colors.primary} /><Text style={styles.themeText}>{theme.dark ? 'Giao diện sáng' : 'Giao diện tối'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Đăng xuất" style={styles.logout} onPress={handleLogout}><MaterialCommunityIcons name="logout" size={20} color={theme.colors.danger} /><Text style={styles.logoutText}>Đăng xuất</Text></Pressable>
      </View>
    </View></View></Modal>
    <Modal visible={panel} transparent animationType="slide" onRequestClose={() => setPanel(false)}><View style={styles.modalBottom}><Pressable style={StyleSheet.absoluteFill} onPress={() => setPanel(false)} /><View style={styles.panel}><View style={styles.handle} /><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Thông báo</Text><Text style={styles.panelCaption}>{unread} chưa đọc</Text></View>{unread > 0 && <Pressable onPress={() => markAll.mutate()}><Text style={styles.readAll}>Đọc tất cả</Text></Pressable>}</View>
      <ScrollView contentContainerStyle={styles.notificationList}>{notifications.isLoading && <Text style={styles.empty}>Đang tải thông báo…</Text>}{notifications.isError && <Text style={styles.error}>Không thể tải thông báo.</Text>}{!notifications.isLoading && !notifications.isError && !items.length && <Text style={styles.empty}>Không có thông báo</Text>}{items.slice(0, 5).map((item) => <Pressable key={item.id} onPress={() => openNotification(item)} style={[styles.notification, !item.isRead && styles.unread]}><View style={styles.flex}><Text style={styles.notificationTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.notificationMessage}>{item.message}</Text><Text style={styles.notificationDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text></View><Pressable accessibilityLabel="Xóa thông báo" onPress={() => remove.mutate(item.id)}><MaterialCommunityIcons name="trash-can-outline" size={theme.sizes.iconSmall} color={theme.colors.danger} /></Pressable></Pressable>)}</ScrollView>
      <Pressable style={styles.allButton} onPress={() => { setPanel(false); router.push('/notifications' as Href); }}><Text style={styles.allButtonText}>Xem tất cả thông báo</Text></Pressable>
    </View></View></Modal>
  </>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  flex: { flex: 1 }, topbar: { marginHorizontal: theme.spacing.md, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm + 6, minHeight: theme.sizes.topbar, paddingHorizontal: theme.spacing.sm + 3, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, shadowColor: theme.colors.shadow, shadowOpacity: theme.dark ? 0.24 : 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  iconButton: { width: theme.touchTarget, height: theme.touchTarget, borderRadius: theme.radius.md - 1, alignItems: 'center', justifyContent: 'center' }, topTitle: { flex: 1, paddingHorizontal: theme.spacing.sm - 1 }, eyebrow: { color: theme.colors.primary, fontSize: theme.typography.caption - 3, fontWeight: '900', letterSpacing: 1.5 }, title: { color: theme.colors.text, fontSize: theme.typography.title + 1, fontWeight: '900' }, actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xxs },
  avatar: { width: theme.sizes.avatar, height: theme.sizes.avatar, borderRadius: theme.radius.md - 1, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: theme.colors.onBrand, fontWeight: '900' }, count: { position: 'absolute', right: 3, top: 3, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.danger, borderWidth: 2, borderColor: theme.colors.surface }, countText: { color: theme.colors.onBrand, fontSize: theme.typography.caption - 2, fontWeight: '900' },
  modal: { flex: 1, backgroundColor: theme.colors.overlay, flexDirection: 'row' }, drawer: { width: '84%', maxWidth: theme.sizes.drawerMax, height: '100%', backgroundColor: theme.colors.background, paddingTop: 50, paddingHorizontal: theme.spacing.sm + 6, paddingBottom: theme.spacing.lg - 2, shadowColor: theme.colors.shadow, shadowOpacity: 0.25, shadowRadius: 22, elevation: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 3, padding: theme.spacing.sm, marginBottom: theme.spacing.sm + 2 }, brandLogo: { width: 45, height: 45, borderRadius: theme.radius.md }, brandName: { color: theme.colors.text, fontSize: theme.typography.heading - 1, fontWeight: '900' }, brandCaption: { color: theme.colors.subtle, fontSize: theme.typography.caption - 2, fontWeight: '800', letterSpacing: 1.2 },
  menu: { gap: theme.spacing.xs + 1, paddingVertical: theme.spacing.xs + 1 }, menuItem: { minHeight: theme.touchTarget + 5, borderRadius: theme.radius.md + 1, paddingHorizontal: theme.spacing.md - 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 5 }, menuActive: { backgroundColor: theme.colors.primary }, menuText: { color: theme.colors.muted, fontSize: theme.typography.bodySmall + 1, fontWeight: '700' }, menuTextActive: { color: theme.colors.onBrand },
  account: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.sm + 6, gap: theme.spacing.sm + theme.spacing.xs }, userRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 3 }, userName: { color: theme.colors.text, fontWeight: '800' }, userEmail: { color: theme.colors.muted, fontSize: theme.typography.caption },
  themeButton: { minHeight: theme.touchTarget, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.sm + 5, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 3, backgroundColor: theme.colors.neutralSoft }, themeText: { color: theme.colors.text, fontWeight: '700' }, logout: { minHeight: theme.touchTarget + 2, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.sm + 5, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 3, backgroundColor: theme.colors.dangerSoft }, logoutText: { color: theme.colors.danger, fontWeight: '800' },
  modalBottom: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay }, panel: { maxHeight: '78%', minHeight: 320, backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, paddingHorizontal: theme.spacing.md + 1, paddingBottom: theme.spacing.lg + 2 }, handle: { width: theme.sizes.sheetHandle, height: 5, borderRadius: theme.radius.pill, backgroundColor: theme.colors.borderStrong, alignSelf: 'center', marginVertical: theme.spacing.sm + 2 }, panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: theme.spacing.sm + 5 }, panelTitle: { color: theme.colors.text, fontSize: theme.typography.heading, fontWeight: '900' }, panelCaption: { color: theme.colors.muted, fontSize: theme.typography.bodySmall - 1 }, readAll: { color: theme.colors.primaryStrong, fontWeight: '800' }, notificationList: { gap: theme.spacing.sm }, notification: { flexDirection: 'row', gap: theme.spacing.sm + 2, padding: theme.spacing.sm + 5, borderRadius: theme.radius.md + 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }, unread: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primaryBorder }, notificationTitle: { color: theme.colors.text, fontWeight: '800', fontSize: theme.typography.bodySmall }, notificationMessage: { color: theme.colors.muted, fontSize: theme.typography.bodySmall - 1, lineHeight: 17, marginTop: 3 }, notificationDate: { color: theme.colors.subtle, fontSize: theme.typography.caption - 1, marginTop: 5 }, empty: { color: theme.colors.muted, textAlign: 'center', paddingVertical: theme.spacing.xl + 3 }, error: { color: theme.colors.danger, textAlign: 'center', paddingVertical: theme.spacing.lg }, allButton: { minHeight: theme.touchTarget + 4, marginTop: theme.spacing.sm + 4, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft }, allButtonText: { color: theme.colors.primaryStrong, fontWeight: '800' },
});
