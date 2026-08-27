import { useState } from 'react';
import { Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthButton, AuthCard, AuthError, AuthField, AuthFooter, AuthShell, authStyles } from '@/components/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submit = async () => { try { await login(email.trim(), password); router.replace('/(tabs)'); } catch { /* store renders error */ } };

  return <AuthShell><AuthCard title="Chào mừng trở lại!" subtitle="Đăng nhập để tiếp tục hành trình tài chính của bạn">
    {!!error && <AuthError>{error}</AuthError>}
    <AuthField label="Email" icon="email-outline" value={email} onChangeText={setEmail} placeholder="Nhập địa chỉ email của bạn" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
    <AuthField label="Mật khẩu" icon="lock-outline" rightLabel="Quên mật khẩu?" onToggleSecure={() => setShowPassword((value) => !value)} value={password} onChangeText={setPassword} placeholder="Nhập mật khẩu" secureTextEntry={!showPassword} autoComplete="password" />
    <AuthButton label="Đăng nhập" onPress={submit} loading={loading} disabled={!email || !password} />
    <Text style={authStyles.switchText}>Chưa có tài khoản? <Link href="/register" style={authStyles.switchLink}>Đăng ký ngay</Link></Text>
  </AuthCard><AuthFooter /></AuthShell>;
}
