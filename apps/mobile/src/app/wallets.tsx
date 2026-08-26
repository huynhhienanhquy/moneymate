import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, ChoiceChips, EmptyState, Field, Screen, SectionTitle, Sheet, StateMessage, ui } from '@/components/ui';
import { ActionLink, EntityCard, IconTile, money } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import type { Wallet } from '@/types/api';
import { theme } from '@/theme';

const walletTypes = [{ label: 'Tiền mặt', value: 'CASH' }, { label: 'Ngân hàng', value: 'BANK' }, { label: 'Ví điện tử', value: 'E_WALLET' }];

export default function WalletsScreen() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''); const [type, setType] = useState('CASH'); const [balance, setBalance] = useState('0');
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: () => apiRequest<Wallet[]>('/wallets') });
  const save = useMutation({ mutationFn: () => apiRequest(editing ? `/wallets/${editing.id}` : '/wallets', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ name: name.trim(), type, initialBalance: Number(balance) }) }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['wallets'] }); setOpen(false); }, onError: (e) => Alert.alert('Không thể lưu ví', e instanceof Error ? e.message : 'Vui lòng thử lại') });
  const remove = useMutation({ mutationFn: (id: string) => apiRequest(`/wallets/${id}`, { method: 'DELETE' }), onSuccess: () => client.invalidateQueries({ queryKey: ['wallets'] }) });
  const showCreate = () => { setEditing(null); setName(''); setType('CASH'); setBalance('0'); setOpen(true); };
  const showEdit = (wallet: Wallet) => { setEditing(wallet); setName(wallet.name); setType(wallet.type); setBalance(String(wallet.initialBalance)); setOpen(true); };
  return <Screen title="Ví tài khoản" action={<Pressable accessibilityRole="button" accessibilityLabel="Thêm ví" onPress={showCreate}><MaterialCommunityIcons name="plus-circle" size={30} color={theme.colors.primary} /></Pressable>}>
    <SectionTitle title="Tất cả ví" caption="Quản lý tiền mặt, ngân hàng và ví điện tử" />
    {wallets.isLoading && <StateMessage loading message="Đang tải ví…" />}{wallets.isError && <StateMessage message="Không thể tải danh sách ví." />}
    {!wallets.isLoading && !wallets.data?.length && <EmptyState icon="wallet-plus-outline" title="Chưa có ví" message="Tạo ví đầu tiên để bắt đầu theo dõi số dư." action={<Button label="Tạo ví" onPress={showCreate} />} />}
    {wallets.data?.map((wallet) => <EntityCard key={wallet.id} icon={<IconTile name="wallet-outline" />} title={wallet.name} subtitle={wallet.type} value={money(wallet.initialBalance)} badge={<Badge label={wallet.currency || 'VND'} />}><View style={ui.row}><View style={{ flex: 1 }}><ActionLink label="Chỉnh sửa" icon="pencil-outline" onPress={() => showEdit(wallet)} /></View><View style={{ flex: 1 }}><ActionLink danger label="Xóa" icon="trash-can-outline" onPress={() => Alert.alert('Xóa ví?', 'Chỉ nên xóa ví không còn giao dịch liên quan.', [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(wallet.id) }])} /></View></View></EntityCard>)}
    <Sheet visible={open} title={editing ? 'Chỉnh sửa ví' : 'Tạo ví mới'} onClose={() => setOpen(false)}><Field label="Tên ví" value={name} onChangeText={setName} /><Text style={ui.muted}>Loại ví</Text><ChoiceChips value={type} options={walletTypes} onChange={setType} /><Field label="Số dư" value={balance} onChangeText={setBalance} keyboardType="numeric" /><Button label={editing ? 'Lưu thay đổi' : 'Tạo ví'} loading={save.isPending} disabled={!name.trim() || Number(balance) < 0} onPress={() => save.mutate()} /></Sheet>
  </Screen>;
}
