import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/app-icon';
import {
  Badge,
  Button,
  EmptyState,
  Screen,
  SectionTitle,
  StateMessage,
  useUiStyles,
} from '@/components/ui';
import { EntityCard, IconTile } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/theme';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Render the notifications page interface.
 *
 * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered notifications page interface.
 */
export default function NotificationsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications'],
    /**
     * Load notifications page data for the query cache.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting notifications page value for the caller.
     */
    queryFn: () =>
      apiRequest<{ notifications: NotificationItem[] }>(
        '/notifications?take=50',
      ),
  });
  const read = useMutation({
    /**
     * Execute the notifications page mutation requested by the client.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting notifications page value for the caller.
     */
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    /**
     * Finalize the notifications page workflow after a successful operation.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting notifications page value for the caller.
     */
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAll = useMutation({
    /**
     * Execute the notifications page mutation requested by the client.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting notifications page value for the caller.
     */
    mutationFn: () =>
      apiRequest('/notifications/read-all', { method: 'PATCH' }),
    /**
     * Finalize the notifications page workflow after a successful operation.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting notifications page value for the caller.
     */
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const remove = useMutation({
    /**
     * Execute the notifications page mutation requested by the client.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @param id - The stable identifier of the record targeted by the operation.
     * @returns The resulting notifications page value for the caller.
     */
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
    /**
     * Finalize the notifications page workflow after a successful operation.
     *
     * Use it to keep the notifications page workflow's presentation and interactions in one reusable UI boundary.
     * @returns The resulting notifications page value for the caller.
     */
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const items = query.data?.notifications || [];
  return (
    <Screen
      title="Thông báo"
      action={
        <Pressable
          accessibilityLabel="Đánh dấu tất cả đã đọc"
          onPress={() => readAll.mutate()}
        >
          <AppIcon name="check-all" size={28} color={theme.colors.primary} />
        </Pressable>
      }
    >
      <SectionTitle
        title="Cập nhật mới"
        caption={`${items.filter((item) => !item.isRead).length} thông báo chưa đọc`}
      />
      {query.isLoading && (
        <StateMessage loading message="Đang tải thông báo…" />
      )}
      {!query.isLoading && !items.length && (
        <EmptyState
          icon="bell-sleep-outline"
          title="Không có thông báo"
          message="Cảnh báo ngân sách và nhắc giao dịch sẽ xuất hiện tại đây."
        />
      )}
      {items.map((item) => (
        <EntityCard
          key={item.id}
          icon={
            <IconTile
              name={
                item.type === 'BUDGET_ALERT' ? 'alert-outline' : 'bell-outline'
              }
              color={item.isRead ? theme.colors.muted : theme.colors.primary}
            />
          }
          title={item.title}
          subtitle={`${item.message}\n${new Date(item.createdAt).toLocaleString('vi-VN')}`}
          badge={!item.isRead ? <Badge label="Mới" /> : undefined}
        >
          <View style={ui.row}>
            {!item.isRead && (
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  label="Đã đọc"
                  onPress={() => read.mutate(item.id)}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                label="Xóa"
                onPress={() =>
                  Alert.alert('Xóa thông báo?', undefined, [
                    { text: 'Hủy' },
                    { text: 'Xóa', onPress: () => remove.mutate(item.id) },
                  ])
                }
              />
            </View>
          </View>
        </EntityCard>
      ))}
    </Screen>
  );
}
