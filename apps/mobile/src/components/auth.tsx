import { useMemo, type ComponentProps, type PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, type AppTheme } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const useAuthStyles = () => { const { theme } = useAppTheme(); return useMemo(() => createStyles(theme), [theme]); };

export function AuthShell({ children }: PropsWithChildren) {
  const styles = useAuthStyles();
  return <SafeAreaView style={styles.safe}><View pointerEvents="none" style={styles.glowTop} /><View pointerEvents="none" style={styles.glowBottom} /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

export function AuthCard({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { theme } = useAppTheme(); const styles = useAuthStyles();
  return <View style={styles.card}><View style={styles.brand}><MaterialCommunityIcons name="wallet-outline" size={theme.sizes.iconLarge} color={theme.colors.primaryStrong} /><Text style={styles.brandText}>MoneyMate</Text></View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>{children}</View>;
}

export function AuthField({ label, icon, rightLabel, onRightPress, onToggleSecure, ...props }: TextInputProps & { label: string; icon: IconName; rightLabel?: string; onRightPress?: () => void; onToggleSecure?: () => void }) {
  const { theme } = useAppTheme(); const styles = useAuthStyles();
  return <View style={styles.field}><View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{rightLabel && <Pressable onPress={onRightPress} hitSlop={theme.spacing.sm}><Text style={styles.rightLabel}>{rightLabel}</Text></Pressable>}</View><View style={styles.inputWrap}><MaterialCommunityIcons name={icon} size={20} color={theme.colors.subtle} /><TextInput accessibilityLabel={label} placeholderTextColor={theme.colors.borderStrong} {...props} style={styles.input} />{props.secureTextEntry !== undefined && <Pressable accessibilityRole="button" accessibilityLabel={props.secureTextEntry ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'} onPress={onToggleSecure} hitSlop={theme.spacing.sm + 1}><MaterialCommunityIcons name={props.secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.subtle} /></Pressable>}</View></View>;
}

export function AuthButton({ label, loading, disabled, onPress }: { label: string; loading?: boolean; disabled?: boolean; onPress: () => void }) {
  const { theme } = useAppTheme(); const styles = useAuthStyles();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, busy: !!loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonDisabled]}><LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradient}>{loading ? <ActivityIndicator color={theme.colors.onBrand} /> : <><Text style={styles.buttonText}>{label}</Text><MaterialCommunityIcons name="arrow-right" size={theme.sizes.iconSmall} color={theme.colors.onBrand} /></>}</LinearGradient></Pressable>;
}

export function AuthFooter() { const styles = useAuthStyles(); return <View style={styles.footer}><Text style={styles.footerBrand}>MoneyMate</Text><View style={styles.footerLinks}><Text style={styles.footerLink}>Điều khoản</Text><Text style={styles.footerLink}>Bảo mật</Text><Text style={styles.footerLink}>Liên hệ</Text></View><Text style={styles.copyright}>© 2024 MoneyMate - Hành trình tài chính thông minh</Text></View>; }
export function AuthError({ children, success = false }: PropsWithChildren<{ success?: boolean }>) { const { theme } = useAppTheme(); const styles = useAuthStyles(); return <View style={[styles.message, success && styles.success]}>{success && <MaterialCommunityIcons name="check-circle-outline" size={theme.sizes.iconSmall} color={theme.colors.successStrong} />}<Text style={[styles.messageText, success && styles.successText]}>{children}</Text></View>; }
export function useAuthTextStyles() { return useAuthStyles(); }

const createStyles = (theme: AppTheme) => StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: theme.colors.background, overflow: 'hidden' },
  glowTop: { position: 'absolute', width: 280, height: 280, borderRadius: theme.radius.pill, backgroundColor: theme.colors.glowPrimary, right: 0, top: -170, opacity: 0.75 }, glowBottom: { position: 'absolute', width: 260, height: 260, borderRadius: theme.radius.pill, backgroundColor: theme.colors.glowSecondary, left: 0, bottom: 40, opacity: 0.7 },
  page: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm + 2, gap: theme.spacing.xl + theme.spacing.sm + 2 },
  card: { width: '100%', maxWidth: theme.sizes.contentMax, alignSelf: 'center', backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm + 1, paddingHorizontal: theme.spacing.lg + 3, paddingVertical: theme.spacing.lg + 5, shadowColor: theme.colors.shadow, shadowOpacity: theme.dark ? 0.22 : 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm + 6 }, brandText: { color: theme.colors.primaryStrong, fontSize: theme.typography.display - 1, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7 }, title: { color: theme.colors.text, fontSize: theme.typography.heading - 1, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 }, subtitle: { color: theme.colors.muted, fontSize: theme.typography.bodySmall + 1, lineHeight: 20, textAlign: 'center', maxWidth: 290, alignSelf: 'center', marginTop: 3, marginBottom: theme.spacing.lg + 3 },
  field: { gap: theme.spacing.sm - 2, marginBottom: theme.spacing.md - 1 }, labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, label: { color: theme.colors.muted, fontSize: theme.typography.bodySmall, fontWeight: '600' }, rightLabel: { color: theme.colors.primaryStrong, fontSize: theme.typography.caption, fontWeight: '800' },
  inputWrap: { minHeight: theme.touchTarget, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.spacing.sm - 1, paddingHorizontal: theme.spacing.sm + 4, backgroundColor: theme.colors.surface }, input: { flex: 1, color: theme.colors.text, fontSize: theme.typography.body, fontWeight: '600', paddingVertical: theme.spacing.sm + 2 },
  button: { height: theme.touchTarget, borderRadius: theme.spacing.sm - 1, overflow: 'hidden', marginTop: theme.spacing.sm + 3 }, gradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm }, buttonText: { color: theme.colors.onBrand, fontSize: theme.typography.bodySmall + 1, fontWeight: '800' }, buttonDisabled: { opacity: 0.62 },
  message: { marginBottom: theme.spacing.sm + 6, padding: theme.spacing.sm + 2, backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.dangerBorder, borderWidth: 1, borderRadius: theme.spacing.sm - 1 }, messageText: { color: theme.colors.danger, fontSize: theme.typography.bodySmall }, success: { flexDirection: 'row', gap: theme.spacing.sm - 1, backgroundColor: theme.colors.successSoft, borderColor: theme.colors.successBorder }, successText: { color: theme.colors.successStrong, flex: 1 },
  switchText: { color: theme.colors.muted, textAlign: 'center', fontSize: theme.typography.bodySmall + 1, marginTop: theme.spacing.xl - 1 }, switchLink: { color: theme.colors.primaryStrong, fontWeight: '800' },
  footer: { alignItems: 'center' }, footerBrand: { color: theme.colors.primaryStrong, fontSize: theme.typography.caption, fontWeight: '900' }, footerLinks: { flexDirection: 'row', gap: theme.spacing.lg - 3, marginVertical: theme.spacing.sm + 1 }, footerLink: { color: theme.colors.subtle, fontSize: theme.typography.caption, fontWeight: '700' }, copyright: { color: theme.colors.muted, fontSize: theme.typography.caption },
});
