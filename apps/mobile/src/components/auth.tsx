import { type ComponentProps, type PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function AuthShell({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.safe}><View pointerEvents="none" style={styles.glowTop} /><View pointerEvents="none" style={styles.glowBottom} /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

export function AuthCard({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return <View style={styles.card}><View style={styles.brand}><MaterialCommunityIcons name="wallet-outline" size={27} color="#0764B8" /><Text style={styles.brandText}>MoneyMate</Text></View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>{children}</View>;
}

export function AuthField({ label, icon, rightLabel, onRightPress, onToggleSecure, ...props }: TextInputProps & { label: string; icon: IconName; rightLabel?: string; onRightPress?: () => void; onToggleSecure?: () => void }) {
  return <View style={styles.field}><View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{rightLabel && <Pressable onPress={onRightPress} hitSlop={8}><Text style={styles.rightLabel}>{rightLabel}</Text></Pressable>}</View><View style={styles.inputWrap}><MaterialCommunityIcons name={icon} size={20} color="#94A3B8" /><TextInput accessibilityLabel={label} placeholderTextColor="#CBD5E1" {...props} style={styles.input} />{props.secureTextEntry !== undefined && <Pressable accessibilityRole="button" accessibilityLabel={props.secureTextEntry ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'} onPress={onToggleSecure} hitSlop={9}><MaterialCommunityIcons name={props.secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" /></Pressable>}</View></View>;
}

export function AuthButton({ label, loading, disabled, onPress }: { label: string; loading?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, busy: !!loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonDisabled]}><LinearGradient colors={['#066BC5', '#007D9B']} start={{ x: 0, y: .5 }} end={{ x: 1, y: .5 }} style={styles.gradient}>{loading ? <ActivityIndicator color="#FFF" /> : <><Text style={styles.buttonText}>{label}</Text><MaterialCommunityIcons name="arrow-right" size={19} color="#FFF" /></>}</LinearGradient></Pressable>;
}

export function AuthFooter() { return <View style={styles.footer}><Text style={styles.footerBrand}>MoneyMate</Text><View style={styles.footerLinks}><Text style={styles.footerLink}>Điều khoản</Text><Text style={styles.footerLink}>Bảo mật</Text><Text style={styles.footerLink}>Liên hệ</Text></View><Text style={styles.copyright}>© 2024 MoneyMate - Hành trình tài chính thông minh</Text></View>; }
export function AuthError({ children, success = false }: PropsWithChildren<{ success?: boolean }>) { return <View style={[styles.message, success && styles.success]}>{success && <MaterialCommunityIcons name="check-circle-outline" size={17} color="#047857" />}<Text style={[styles.messageText, success && styles.successText]}>{children}</Text></View>; }
const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: '#F5F8FC' },
  glowTop: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#E1EEF8', right: -140, top: -120, opacity: .75 },
  glowBottom: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#E4F2F6', left: -155, bottom: 100, opacity: .7 },
  page: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 10, gap: 42 },
  card: { width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFF', borderRadius: 11, paddingHorizontal: 27, paddingVertical: 29, shadowColor: '#265078', shadowOpacity: .1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  brandText: { color: '#0764B8', fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -.7 },
  title: { color: '#111827', fontSize: 21, fontWeight: '900', textAlign: 'center', letterSpacing: -.3 },
  subtitle: { color: '#5B6472', fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 290, alignSelf: 'center', marginTop: 3, marginBottom: 27 },
  field: { gap: 6, marginBottom: 15 }, labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#5B6472', fontSize: 13, fontWeight: '600' }, rightLabel: { color: '#0873C9', fontSize: 11, fontWeight: '800' },
  inputWrap: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 7, paddingHorizontal: 12, backgroundColor: '#FFF' },
  input: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 10 },
  button: { height: 43, borderRadius: 7, overflow: 'hidden', marginTop: 11 }, gradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' }, buttonDisabled: { opacity: .62 },
  message: { marginBottom: 14, padding: 10, backgroundColor: '#FFF1F2', borderColor: '#FECDD3', borderWidth: 1, borderRadius: 7 }, messageText: { color: '#E11D48', fontSize: 13 }, success: { flexDirection: 'row', gap: 7, backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }, successText: { color: '#047857', flex: 1 },
  switchText: { color: '#5B6472', textAlign: 'center', fontSize: 14, marginTop: 31 }, switchLink: { color: '#0873C9', fontWeight: '800' },
  footer: { alignItems: 'center' }, footerBrand: { color: '#0873C9', fontSize: 11, fontWeight: '900' }, footerLinks: { flexDirection: 'row', gap: 21, marginVertical: 9 }, footerLink: { color: '#B3BDCA', fontSize: 11, fontWeight: '700' }, copyright: { color: '#657080', fontSize: 11 },
});

export const authStyles = styles;
