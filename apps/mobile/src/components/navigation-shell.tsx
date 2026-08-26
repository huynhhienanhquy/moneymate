import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, type Href } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { theme } from '@/theme';

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
  { label: 'Hồ sơ', href: '/(tabs)/profile', icon: 'account-outline' }
] as const;

export function MobileTopBar({ title }: { title: string }) {
  const router = useRouter(); const pathname = usePathname(); const client = useQueryClient();
  const { user, logout } = useAuthStore(); const [drawer, setDrawer] = useState(false); const [panel, setPanel] = useState(false);
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => apiRequest<NotificationResult>('/notifications?take=20'), refetchInterval: 60_000 });
  const markRead = useMutation({ mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAll = useMutation({ mutationFn: () => apiRequest('/notifications/read-all', { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const remove = useMutation({ mutationFn: (id: string) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const items = notifications.data?.notifications || []; const unread = notifications.data?.unreadCount ?? items.filter((item) => !item.isRead).length;
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
        <Pressable accessibilityRole="button" accessibilityLabel="Mở hồ sơ" onPress={() => router.push('/(tabs)/profile' as Href)}><LinearGradient colors={[theme.colors.primaryStrong, theme.colors.primary, theme.colors.cyan]} style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'M'}</Text></LinearGradient></Pressable>
      </View>
    </View>
    <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}><View style={styles.modal}><Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDrawer(false)} /><View style={styles.drawer}>
      <View style={styles.brand}><Image source={require('../../assets/images/moneymate-logo.png')} accessibilityLabel="Logo MoneyMate" contentFit="cover" style={styles.brandLogo} /><View style={{ flex: 1 }}><Text style={styles.brandName}>MoneyMate</Text><Text style={styles.brandCaption}>SMART FINANCE</Text></View><Pressable accessibilityLabel="Đóng menu" style={styles.iconButton} onPress={() => setDrawer(false)}><MaterialCommunityIcons name="close" size={22} color={theme.colors.muted} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.menu}>{menu.map((item) => <Pressable accessibilityRole="button" key={item.href} onPress={() => go(item.href)} style={[styles.menuItem, isActive(item.href) && styles.menuActive]}><MaterialCommunityIcons name={item.icon} size={21} color={isActive(item.href) ? '#fff' : theme.colors.muted} /><Text style={[styles.menuText, isActive(item.href) && styles.menuTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
      <View style={styles.account}><View style={styles.userRow}><LinearGradient colors={[theme.colors.primary, theme.colors.cyan]} style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'M'}</Text></LinearGradient><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.userName}>{user?.fullName}</Text><Text numberOfLines={1} style={styles.userEmail}>{user?.email}</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="Đăng xuất" style={styles.logout} onPress={handleLogout}><MaterialCommunityIcons name="logout" size={20} color={theme.colors.danger} /><Text style={styles.logoutText}>Đăng xuất</Text></Pressable></View>
    </View></View></Modal>
    <Modal visible={panel} transparent animationType="slide" onRequestClose={() => setPanel(false)}><View style={styles.modalBottom}><Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPanel(false)} /><View style={styles.panel}><View style={styles.handle} /><View style={styles.panelHeader}><View><Text style={styles.panelTitle}>Thông báo</Text><Text style={styles.panelCaption}>{unread} chưa đọc</Text></View>{unread > 0 && <Pressable onPress={() => markAll.mutate()}><Text style={styles.readAll}>Đọc tất cả</Text></Pressable>}</View>
      <ScrollView contentContainerStyle={styles.notificationList}>{notifications.isLoading && <Text style={styles.empty}>Đang tải thông báo…</Text>}{!notifications.isLoading && !items.length && <Text style={styles.empty}>Không có thông báo</Text>}{items.slice(0, 5).map((item) => <Pressable key={item.id} onPress={() => openNotification(item)} style={[styles.notification, !item.isRead && styles.unread]}><View style={{ flex: 1 }}><Text style={styles.notificationTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.notificationMessage}>{item.message}</Text><Text style={styles.notificationDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text></View><Pressable accessibilityLabel="Xóa thông báo" onPress={() => remove.mutate(item.id)}><MaterialCommunityIcons name="trash-can-outline" size={19} color={theme.colors.danger} /></Pressable></Pressable>)}</ScrollView>
      <Pressable style={styles.allButton} onPress={() => { setPanel(false); router.push('/notifications' as Href); }}><Text style={styles.allButtonText}>Xem tất cả thông báo</Text></Pressable>
    </View></View></Modal>
  </>;
}

const styles = StyleSheet.create({
  topbar: { marginHorizontal: 16, marginTop: 8, marginBottom: 14, minHeight: 66, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: '#fff', borderRadius: 24, shadowColor: theme.colors.primary, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, topTitle: { flex: 1, paddingHorizontal: 7 }, eyebrow: { color: theme.colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }, title: { color: theme.colors.text, fontSize: 19, fontWeight: '900' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  avatar: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontWeight: '900' }, count: { position: 'absolute', right: 3, top: 3, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.danger, borderWidth: 2, borderColor: '#fff' }, countText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  modal: { flex: 1, backgroundColor: 'rgba(15,23,42,0.52)', flexDirection: 'row' }, drawer: { width: '84%', maxWidth: 320, height: '100%', backgroundColor: theme.colors.background, paddingTop: 50, paddingHorizontal: 14, paddingBottom: 22, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 22, elevation: 20 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 8, marginBottom: 10 }, brandLogo: { width: 45, height: 45, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, brandName: { color: theme.colors.text, fontSize: 21, fontWeight: '900' }, brandCaption: { color: theme.colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, menu: { gap: 5, paddingVertical: 5 }, menuItem: { minHeight: 49, borderRadius: 17, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 13 }, menuActive: { backgroundColor: theme.colors.primary }, menuText: { color: theme.colors.muted, fontSize: 14, fontWeight: '700' }, menuTextActive: { color: '#fff' },
  account: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14, gap: 12 }, userRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, userName: { color: theme.colors.text, fontWeight: '800' }, userEmail: { color: theme.colors.muted, fontSize: 11 }, logout: { minHeight: 46, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.colors.dangerSoft }, logoutText: { color: theme.colors.danger, fontWeight: '800' },
  modalBottom: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.48)' }, panel: { maxHeight: '78%', minHeight: 320, backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 17, paddingBottom: 26 }, handle: { width: 42, height: 5, borderRadius: 4, backgroundColor: '#CBD5E1', alignSelf: 'center', marginVertical: 10 }, panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 13 }, panelTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '900' }, panelCaption: { color: theme.colors.muted, fontSize: 12 }, readAll: { color: theme.colors.primaryStrong, fontWeight: '800' }, notificationList: { gap: 8 }, notification: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff' }, unread: { backgroundColor: theme.colors.primarySoft, borderColor: '#C7E5FF' }, notificationTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 13 }, notificationMessage: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, notificationDate: { color: theme.colors.subtle, fontSize: 10, marginTop: 5 }, empty: { color: theme.colors.muted, textAlign: 'center', paddingVertical: 35 }, allButton: { minHeight: 48, marginTop: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft }, allButtonText: { color: theme.colors.primaryStrong, fontWeight: '800' }
});
