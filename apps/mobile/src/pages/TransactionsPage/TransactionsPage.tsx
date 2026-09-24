import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter, type Href } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, ChoiceChips, EmptyState, Field, Screen, StateMessage, useUiStyles } from '@/components/ui';
import { apiRequest } from '@/lib/api';
import type { Transaction } from '@/types/api';
import { useAppTheme } from '@/theme';
import { useOfflineStorage } from '@/storage/offline';
import { useAuthStore } from '@/stores/auth.store';

export default function TransactionsPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const offlineStorage = useOfflineStorage(); const router = useRouter(); const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [failedCount, setFailedCount] = useState(0); const [search, setSearch] = useState(''); const [type, setType] = useState('ALL');
  const query = useQuery({ queryKey: ['transactions'], queryFn: () => apiRequest<{ transactions: Transaction[] }>('/transactions?take=50&order=desc') });
  const remove = useMutation({ mutationFn: (item: Transaction) => apiRequest(`/transactions/${item.id}?version=${item.version}`, { method: 'DELETE' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }), onError: (error) => Alert.alert('Không thể xóa', error instanceof Error ? error.message : 'Vui lòng tải lại và thử lại') });
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void offlineStorage.getFailedCount(userId).then((count) => {
      if (active) setFailedCount(count);
    });
    return () => { active = false; };
  }, [offlineStorage, query.dataUpdatedAt, userId]);
  const filtered = (query.data?.transactions || []).filter((item) => (type === 'ALL' || item.type === type) && `${item.category?.name || ''} ${item.note || ''} ${item.wallet?.name || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <Screen title="Giao dịch" action={<Link href="/add-transaction" asChild><Pressable accessibilityRole="button" accessibilityLabel="Thêm giao dịch"><MaterialCommunityIcons name="plus-circle" size={30} color={theme.colors.primary} /></Pressable></Link>}>
    <View style={ui.row}><View style={{ flex: 1 }}><Link href="/scan-receipt" asChild><Pressable><Card><MaterialCommunityIcons name="line-scan" size={25} color={theme.colors.primary} /><Text style={ui.text}>Quét hóa đơn</Text></Card></Pressable></Link></View><View style={{ flex: 1 }}><Link href={'/transfer' as Href} asChild><Pressable><Card><MaterialCommunityIcons name="swap-horizontal" size={25} color={theme.colors.cyan} /><Text style={ui.text}>Chuyển tiền</Text></Card></Pressable></Link></View></View>
    <Field label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder="Danh mục, ví hoặc ghi chú" /><ChoiceChips value={type} options={[{ label: 'Tất cả', value: 'ALL' }, { label: 'Thu', value: 'INCOME' }, { label: 'Chi', value: 'EXPENSE' }, { label: 'Chuyển', value: 'TRANSFER' }]} onChange={setType} />
    {failedCount > 0 && <Card><Text style={ui.negative}>{failedCount} thay đổi chưa đồng bộ. Kiểm tra kết nối trước khi sửa tiếp.</Text></Card>}{query.isLoading && <StateMessage loading message="Đang tải giao dịch…" />}{query.isError && <StateMessage message="Không thể tải giao dịch." />}{!query.isLoading && !filtered.length && <EmptyState icon="receipt-text-outline" title="Không có giao dịch" message={search || type !== 'ALL' ? 'Không có kết quả phù hợp bộ lọc.' : 'Thêm giao dịch đầu tiên để bắt đầu theo dõi.'} />}
    {filtered.map((item) => <Card key={item.id}><View style={ui.between}><View style={{ flex: 1 }}><Text style={ui.text}>{item.category?.name || (item.type === 'TRANSFER' ? 'Chuyển tiền' : 'Giao dịch')}</Text><Text numberOfLines={1} style={ui.muted}>{item.note || item.wallet?.name} · {new Date(item.transactionDate).toLocaleDateString('vi-VN')}</Text></View><Text style={item.type === 'INCOME' ? ui.positive : ui.negative}>{Number(item.amount).toLocaleString('vi-VN')} ₫</Text></View>{item.type !== 'TRANSFER' && <View style={ui.row}><View style={{ flex: 1 }}><Button variant="secondary" label="Chỉnh sửa" onPress={() => router.push({ pathname: '/add-transaction', params: { id: item.id } })} /></View><View style={{ flex: 1 }}><Button variant="danger" label="Xóa" loading={remove.isPending && remove.variables?.id === item.id} onPress={() => Alert.alert('Xóa giao dịch?', 'Thao tác sẽ đồng bộ trên mọi thiết bị.', [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(item) }])} /></View></View>}</Card>)}
  </Screen>;
}
