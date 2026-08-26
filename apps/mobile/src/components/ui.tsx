import { useEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { MobileTopBar } from '@/components/navigation-shell';

export function Screen({ children, title, action, refreshing = false, onRefresh }: PropsWithChildren<{ title: string; action?: ReactNode; refreshing?: boolean; onRefresh?: () => void }>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View pointerEvents="none" style={styles.glowOne} />
      <View pointerEvents="none" style={styles.glowTwo} />
      <MobileTopBar title={title} />
      {action && <View style={styles.pageAction}>{action}</View>}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children }: PropsWithChildren) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => { Animated.parallel([Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }), Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true })]).start(); }, [opacity, translateY]);
  return <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function SectionTitle({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) {
  return <View style={styles.sectionHeader}><View style={{ flex: 1 }}><Text style={ui.heading}>{title}</Text>{caption && <Text style={ui.muted}>{caption}</Text>}</View>{action}</View>;
}

export function Badge({ label, tone = 'info' }: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }) {
  return <View style={[styles.badge, styles[`${tone}Badge`]]}><Text style={[styles.badgeText, styles[`${tone}BadgeText`]]}>{label}</Text></View>;
}

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : theme.colors.primary;
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>;
}

export function EmptyState({ icon = 'inbox-outline', title, message, action }: { icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; message: string; action?: ReactNode }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><MaterialCommunityIcons name={icon} size={28} color={theme.colors.primary} /></View><Text style={ui.heading}>{title}</Text><Text style={styles.emptyText}>{message}</Text>{action}</View>;
}

export function Sheet({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} /><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={ui.between}><Text style={styles.sheetTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton}><MaterialCommunityIcons name="close" size={20} color={theme.colors.muted} /></Pressable></View><ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">{children}</ScrollView></View></View></Modal>;
}

export function ChoiceChips({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  return <View style={styles.chips}>{options.map((option) => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={[styles.chip, value === option.value && styles.chipActive]}><Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>{option.label}</Text></Pressable>)}</View>;
}

export function Field(props: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput accessibilityLabel={props.accessibilityLabel || props.label} placeholderTextColor={theme.colors.muted} {...props} style={[styles.input, props.style]} />
    </View>
  );
}

export function Button({ label, onPress, loading, variant = 'primary', disabled }: {
  label: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => { void (variant === 'danger' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); onPress(); }}
      style={({ pressed }) => [styles.button, styles[variant], (pressed || disabled) && styles.buttonPressed]}
    >
      {variant === 'primary' ? <LinearGradient colors={[theme.colors.primaryStrong, theme.colors.primary, theme.colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{label}</Text>}</LinearGradient> : loading ? <ActivityIndicator color={variant === 'danger' ? '#fff' : theme.colors.primary} /> : <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}>{label}</Text>}
    </Pressable>
  );
}

export function StateMessage({ message, loading }: { message: string; loading?: boolean }) {
  return <View style={styles.state}>{loading && <ActivityIndicator color={theme.colors.primary} />}<Text style={styles.muted}>{message}</Text></View>;
}

export function SkeletonCard() {
  return <View accessibilityLabel="Đang tải" style={styles.card}><View style={[styles.skeleton, { width: '42%', height: 15 }]} /><View style={[styles.skeleton, { width: '78%', height: 12 }]} /><View style={[styles.skeleton, { width: '58%', height: 12 }]} /></View>;
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  text: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  amount: { color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  positive: { color: theme.colors.success },
  negative: { color: theme.colors.danger },
  gap: { gap: 12 }
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  glowOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#DDF1FF', top: -120, right: -100, opacity: 0.75 },
  glowTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#F1EAFE', bottom: 80, left: -150, opacity: 0.55 },
  header: { marginHorizontal: 16, marginTop: 8, marginBottom: 14, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: '#FFFFFF', borderRadius: theme.radius.lg, shadowColor: '#2A95FF', shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoMark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } },
  eyebrow: { color: theme.colors.primary, fontSize: 9, letterSpacing: 1.8, fontWeight: '900' },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
  content: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 38, gap: 14 },
  pageAction: { position: 'absolute', right: 24, top: 92, zIndex: 5 },
  card: { backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 17, gap: 11, shadowColor: '#64748B', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  field: { gap: 7 },
  label: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  input: { color: theme.colors.text, backgroundColor: '#FFFFFF', borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, paddingHorizontal: 15, paddingVertical: 13, fontSize: 16, shadowColor: '#64748B', shadowOpacity: 0.04, shadowRadius: 6 },
  button: { minHeight: 50, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  buttonGradient: { minHeight: 50, width: '100%', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: theme.colors.primaryStrong, shadowColor: theme.colors.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  secondary: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.danger },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryText: { color: theme.colors.text },
  buttonPressed: { opacity: 0.65 },
  state: { padding: 28, alignItems: 'center', gap: 12 },
  muted: { color: theme.colors.muted, textAlign: 'center' }
  ,sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 5 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoBadge: { backgroundColor: theme.colors.primarySoft, borderColor: '#C7E5FF' }, infoBadgeText: { color: theme.colors.primaryStrong },
  successBadge: { backgroundColor: theme.colors.successSoft, borderColor: '#BBF7D0' }, successBadgeText: { color: '#059669' },
  warningBadge: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }, warningBadgeText: { color: '#D97706' },
  dangerBadge: { backgroundColor: theme.colors.dangerSoft, borderColor: '#FECDD3' }, dangerBadgeText: { color: theme.colors.danger },
  neutralBadge: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }, neutralBadgeText: { color: theme.colors.muted },
  progressTrack: { height: 9, borderRadius: 999, backgroundColor: '#E8EEF7', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  empty: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 18, gap: 9 },
  emptyIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft },
  emptyText: { color: theme.colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', minHeight: 260, backgroundColor: theme.colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, paddingHorizontal: 18, paddingBottom: 28 },
  sheetHandle: { width: 42, height: 5, borderRadius: 99, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  closeButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF0F8' },
  sheetContent: { paddingVertical: 17, gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: theme.colors.primaryStrong },
  skeleton: { borderRadius: 8, backgroundColor: '#E6EDF7' }
});
