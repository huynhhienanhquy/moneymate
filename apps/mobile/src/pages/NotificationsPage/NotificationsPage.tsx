import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, EmptyState, Screen, SectionTitle, StateMessage, ui } from '@/components/ui';
import { EntityCard, IconTile } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import { theme } from '@/theme';

interface NotificationItem { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }

export default function NotificationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: () => apiRequest<{ notifications: NotificationItem[] }>('/notifications?take=50') });
  const read = useMutation({ mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const readAll = useMutation({ mutationFn: () => apiRequest('/notifications/read-all', { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const remove = useMutation({ mutationFn: (id: string) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const items = query.data?.notifications || [];
  return <Screen title="Thông báo" action={<Pressable accessibilityLabel="Đánh dấu tất cả đã đọc" onPress={() => readAll.mutate()}><MaterialCommunityIcons name="check-all" size={28} color={theme.colors.primary} /></Pressable>}><SectionTitle title="Cập nhật mới" caption={`${items.filter((item) => !item.isRead).length} thông báo chưa đọc`} />{query.isLoading && <StateMessage loading message="Đang tải thông báo…" />}{!query.isLoading && !items.length && <EmptyState icon="bell-sleep-outline" title="Không có thông báo" message="Cảnh báo ngân sách và nhắc giao dịch sẽ xuất hiện tại đây." />}{items.map((item) => <EntityCard key={item.id} icon={<IconTile name={item.type === 'BUDGET_ALERT' ? 'alert-outline' : 'bell-outline'} color={item.isRead ? theme.colors.muted : theme.colors.primary} />} title={item.title} subtitle={`${item.message}\n${new Date(item.createdAt).toLocaleString('vi-VN')}`} badge={!item.isRead ? <Badge label="Mới" /> : undefined}><View style={ui.row}>{!item.isRead && <View style={{ flex: 1 }}><Button variant="secondary" label="Đã đọc" onPress={() => read.mutate(item.id)} /></View>}<View style={{ flex: 1 }}><Button variant="secondary" label="Xóa" onPress={() => Alert.alert('Xóa thông báo?', undefined, [{ text: 'Hủy' }, { text: 'Xóa', onPress: () => remove.mutate(item.id) }])} /></View></View></EntityCard>)}</Screen>;
}
