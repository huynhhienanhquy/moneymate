import { useState } from 'react';
import { Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthButton, AuthCard, AuthError, AuthField, AuthFooter, AuthShell, authStyles } from '@/components/auth';
import { apiRequest } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
    setLoading(true); setError('');
    try { await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }) }, false); router.replace('/login'); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Đăng ký thất bại'); }
    finally { setLoading(false); }
  };
  return <AuthShell><AuthCard title="Tạo tài khoản" subtitle="Bắt đầu hành trình tài chính thông minh của bạn">
    {!!error && <AuthError>{error}</AuthError>}
    <AuthField label="Họ và tên" icon="account-outline" value={fullName} onChangeText={setFullName} placeholder="Nhập họ và tên của bạn" autoComplete="name" />
    <AuthField label="Email" icon="email-outline" value={email} onChangeText={setEmail} placeholder="Nhập địa chỉ email của bạn" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <AuthField label="Mật khẩu" icon="lock-outline" onToggleSecure={() => setShowPassword((value) => !value)} value={password} onChangeText={setPassword} placeholder="Tối thiểu 8 ký tự" secureTextEntry={!showPassword} autoComplete="new-password" />
    <AuthField label="Xác nhận mật khẩu" icon="lock-check-outline" onToggleSecure={() => setShowPassword((value) => !value)} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Nhập lại mật khẩu" secureTextEntry={!showPassword} autoComplete="new-password" />
    <AuthButton label="Đăng ký" onPress={submit} loading={loading} disabled={!fullName.trim() || !email.trim() || password.length < 8 || !confirmPassword} />
    <Text style={authStyles.switchText}>Đã có tài khoản? <Link href="/login" style={authStyles.switchLink}>Đăng nhập</Link></Text>
  </AuthCard><AuthFooter /></AuthShell>;
}
