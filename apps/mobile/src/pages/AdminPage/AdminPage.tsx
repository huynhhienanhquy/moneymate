import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, ChoiceChips, EmptyState, Field, Screen, SectionTitle, Sheet, StateMessage, useUiStyles } from '@/components/ui';
import { ActionLink, EntityCard, IconTile } from '@/components/finance';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useAppTheme } from '@/theme';
import type { AdminUser } from '@/types/api';

type RoleFilter = 'ALL' | AdminUser['role'];
const EMPTY_USERS: AdminUser[] = [];

export default function AdminPage() {
  const ui = useUiStyles();
  const { theme } = useAppTheme();
  const currentUser = useAuthStore((state) => state.user);
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [editing, setEditing] = useState<AdminUser | 'create' | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('USER');
  const [formError, setFormError] = useState('');
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => apiRequest<AdminUser[]>('/admin/users') });
  const close = () => { setEditing(null); setFormError(''); };
  const save = useMutation({
    mutationFn: () => editing === 'create'
      ? apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }) })
      : apiRequest(`/admin/users/${editing!.id}`, { method: 'PUT', body: JSON.stringify({ fullName: fullName.trim(), role }) }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin-users'] }); close(); },
    onError: (error) => setFormError(error instanceof Error ? error.message : 'Không thể lưu tài khoản.'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin-users'] }); close(); },
    onError: (error) => setFormError(error instanceof Error ? error.message : 'Không thể xóa tài khoản.'),
  });
  const open = (user: AdminUser | 'create') => {
    setEditing(user); setFullName(user === 'create' ? '' : user.fullName); setEmail(user === 'create' ? '' : user.email);
    setPassword(''); setRole(user === 'create' ? 'USER' : user.role); setFormError('');
  };
  const list = users.data || EMPTY_USERS;
  const stats = useMemo(() => ({
    admins: list.filter((item) => item.role === 'ADMIN').length,
    transactions: list.reduce((total, item) => total + item._count.transactions, 0),
    wallets: list.reduce((total, item) => total + item._count.wallets, 0),
  }), [list]);
  const filtered = useMemo(() => list.filter((item) => {
    const haystack = `${item.fullName} ${item.email} ${item.role}`.toLocaleLowerCase('vi');
    return haystack.includes(search.trim().toLocaleLowerCase('vi')) && (roleFilter === 'ALL' || item.role === roleFilter);
  }), [list, roleFilter, search]);
  const ownAccount = editing !== null && editing !== 'create' && editing.id === currentUser?.id;
  const canSave = !!fullName.trim() && (editing !== 'create' || (!!email.trim() && password.length >= 8));
  return <Screen title="Quản trị" action={<Pressable accessibilityLabel="Thêm người dùng" onPress={() => open('create')}><MaterialCommunityIcons name="account-plus" size={30} color={theme.colors.primary} /></Pressable>}>
    <SectionTitle title="Quản lý người dùng" caption="Phân quyền và quản lý tài khoản toàn hệ thống" />
    <View style={ui.row}>
      <View style={{ flex: 1 }}><Card><IconTile name="account-group-outline" /><Text style={ui.muted}>Tài khoản</Text><Text style={ui.heading}>{list.length.toLocaleString('vi-VN')}</Text></Card></View>
      <View style={{ flex: 1 }}><Card><IconTile name="shield-account-outline" color={theme.colors.violet} background={theme.colors.glowSecondary} /><Text style={ui.muted}>Admin</Text><Text style={ui.heading}>{stats.admins.toLocaleString('vi-VN')}</Text></Card></View>
    </View>
    <Card><View style={ui.between}><Text style={ui.text}>Hoạt động hệ thống</Text><Badge label={`${stats.wallets} ví`} tone="neutral" /></View><Text style={ui.muted}>{stats.transactions.toLocaleString('vi-VN')} giao dịch đã ghi nhận</Text></Card>
    <Field label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder="Tên hoặc email" autoCapitalize="none" />
    <ChoiceChips value={roleFilter} options={[{ label: `Tất cả (${list.length})`, value: 'ALL' }, { label: `User (${list.length - stats.admins})`, value: 'USER' }, { label: `Admin (${stats.admins})`, value: 'ADMIN' }]} onChange={(value) => setRoleFilter(value as RoleFilter)} />
    {users.isLoading && <StateMessage loading message="Đang tải người dùng…" />}
    {users.isError && <Card><StateMessage message="Không thể tải danh sách người dùng." /><Button variant="secondary" label="Thử lại" onPress={() => { void users.refetch(); }} /></Card>}
    {!users.isLoading && !users.isError && !filtered.length && <EmptyState icon="account-search-outline" title="Không tìm thấy người dùng" message="Thử thay đổi từ khóa hoặc bộ lọc vai trò." />}
    {filtered.map((item) => <EntityCard key={item.id} icon={<IconTile name={item.role === 'ADMIN' ? 'shield-account-outline' : 'account-outline'} color={item.role === 'ADMIN' ? theme.colors.violet : theme.colors.primary} background={item.role === 'ADMIN' ? theme.colors.glowSecondary : theme.colors.primarySoft} />} title={item.fullName} subtitle={`${item.email} · ${new Date(item.createdAt).toLocaleDateString('vi-VN')}`} badge={<Badge label={item.role === 'ADMIN' ? 'Admin' : 'User'} tone={item.role === 'ADMIN' ? 'info' : 'neutral'} />}>
      <View style={ui.between}><Text style={ui.muted}>{item._count.transactions} giao dịch</Text><Text style={ui.muted}>{item._count.wallets} ví</Text></View>
      <ActionLink label={item.id === currentUser?.id ? 'Tài khoản của bạn' : 'Quản lý'} icon={item.role === 'ADMIN' ? 'cog-outline' : 'pencil-outline'} onPress={() => open(item)} />
    </EntityCard>)}
    <Sheet visible={editing !== null} title={editing === 'create' ? 'Thêm người dùng' : 'Cập nhật tài khoản'} onClose={() => { if (!save.isPending && !remove.isPending) close(); }}>
      <Field label="Họ và tên" value={fullName} onChangeText={setFullName} editable={!ownAccount} />
      <Field label="Email" value={email} onChangeText={setEmail} editable={editing === 'create'} keyboardType="email-address" autoCapitalize="none" />
      {editing === 'create' ? <Field label="Mật khẩu (tối thiểu 8 ký tự)" value={password} onChangeText={setPassword} secureTextEntry /> : <><Text style={ui.muted}>Phân quyền</Text><ChoiceChips value={role} options={[{ label: 'Người dùng', value: 'USER' }, { label: 'Quản trị viên', value: 'ADMIN' }]} onChange={(value) => setRole(value as AdminUser['role'])} /></>}
      {ownAccount && <Text style={ui.muted}>Hãy cập nhật tài khoản của bạn trong phần Hồ sơ & bảo mật.</Text>}
      {!!formError && <Text style={ui.negative}>{formError}</Text>}
      {!ownAccount && <Button label={editing === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'} loading={save.isPending} disabled={!canSave} onPress={() => save.mutate()} />}
      {editing !== null && editing !== 'create' && !ownAccount && <Button variant="danger" label="Xóa người dùng" loading={remove.isPending} onPress={() => Alert.alert('Xóa người dùng?', `Tài khoản ${editing.fullName} sẽ bị xóa vĩnh viễn.`, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(editing.id) }])} />}
    </Sheet>
  </Screen>;
}
