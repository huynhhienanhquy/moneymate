import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Screen, ui } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { registerForPushNotifications } from '@/lib/notifications';
import { apiRequest } from '@/lib/api';

interface Session { id: string; deviceName?: string; platform: string; appVersion?: string; lastSeenAt: string; expiresAt: string }

export default function ProfilePage() {
  const { user, logout, deleteAccount, unlockWithBiometrics, updateCachedUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [biometricMessage, setBiometricMessage] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => apiRequest<Session[]>('/auth/sessions') });
  const revoke = useMutation({
    mutationFn: (id: string) => apiRequest(`/auth/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] })
  });
  const updateProfile = useMutation({
    mutationFn: () => apiRequest<typeof user>('/users/profile', { method: 'PUT', body: JSON.stringify({ fullName: fullName.trim(), avatarUrl: avatarUrl.trim() || null }) }),
    onSuccess: async (profile) => { if (profile) await updateCachedUser(profile); Alert.alert('Đã lưu', 'Hồ sơ đã được cập nhật.'); }
  });
  const changePassword = useMutation({
    mutationFn: () => apiRequest('/users/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
    onSuccess: () => { setCurrentPassword(''); setNewPassword(''); Alert.alert('Thành công', 'Mật khẩu đã được thay đổi.'); }
  });
  return <Screen title="Tài khoản">
    <Card><Text style={ui.heading}>Thông tin cá nhân</Text><Text style={ui.muted}>{user?.email}</Text><Field label="Họ và tên" value={fullName} onChangeText={setFullName} /><Field label="Ảnh đại diện (URL)" value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" /><Button label="Lưu thay đổi" loading={updateProfile.isPending} disabled={!fullName.trim()} onPress={() => updateProfile.mutate()} /></Card>
    <Card><Text style={ui.heading}>Đổi mật khẩu</Text><Field label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry /><Field label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry /><Button variant="secondary" label="Cập nhật mật khẩu" loading={changePassword.isPending} disabled={!currentPassword || newPassword.length < 8} onPress={() => changePassword.mutate()} /></Card>
    <Card><Text style={ui.heading}>Bảo mật thiết bị</Text><Text style={ui.muted}>Kiểm tra Face ID, Touch ID hoặc vân tay trước khi bật khóa nhanh.</Text><Button variant="secondary" label="Kiểm tra sinh trắc học" onPress={async () => setBiometricMessage(await unlockWithBiometrics() ? 'Xác thực thành công' : 'Không thể xác thực')} />{!!biometricMessage && <Text style={ui.muted}>{biometricMessage}</Text>}</Card>
    <Card><Text style={ui.heading}>Thông báo</Text><Text style={ui.muted}>Nhận cảnh báo ngân sách và nhắc giao dịch định kỳ trên thiết bị này.</Text><Button variant="secondary" label="Bật thông báo" onPress={async () => { try { await registerForPushNotifications(); setPushMessage('Đã đăng ký thông báo'); } catch (error) { setPushMessage(error instanceof Error ? error.message : 'Không thể đăng ký'); } }} />{!!pushMessage && <Text style={ui.muted}>{pushMessage}</Text>}</Card>
    <Card><Text style={ui.heading}>Thiết bị đang đăng nhập</Text>{sessions.isLoading && <Text style={ui.muted}>Đang tải…</Text>}{sessions.isError && <Text style={ui.negative}>Không thể tải danh sách phiên.</Text>}{sessions.data?.map((session) => <Card key={session.id}><Text style={ui.text}>{session.deviceName || session.platform}</Text><Text style={ui.muted}>{session.platform}{session.appVersion ? ` · ${session.appVersion}` : ''} · {new Date(session.lastSeenAt).toLocaleString('vi-VN')}</Text><Button variant="secondary" label="Đăng xuất thiết bị này" loading={revoke.isPending && revoke.variables === session.id} onPress={() => revoke.mutate(session.id)} /></Card>)}</Card>
    <Button variant="danger" label="Đăng xuất" onPress={logout} />
    <Card><Text style={[ui.heading, ui.negative]}>Xóa tài khoản</Text><Text style={ui.muted}>Thao tác này xóa vĩnh viễn tài khoản và dữ liệu liên quan. Nhập mật khẩu để xác nhận.</Text><Field label="Mật khẩu xác nhận" value={deletePassword} onChangeText={setDeletePassword} secureTextEntry />{!!deleteMessage && <Text style={ui.negative}>{deleteMessage}</Text>}<Button variant="danger" label="Xóa vĩnh viễn" disabled={!deletePassword} onPress={async () => { try { await deleteAccount(deletePassword); } catch (error) { setDeleteMessage(error instanceof Error ? error.message : 'Không thể xóa tài khoản'); } }} /></Card>
  </Screen>;
}
