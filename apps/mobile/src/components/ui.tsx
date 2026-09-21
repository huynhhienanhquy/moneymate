import { useEffect, useMemo, useState, type PropsWithChildren, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, type AppTheme } from '@/theme';
import { MobileTopBar } from '@/components/navigation-shell';

export function useUiStyles() {
  const { theme } = useAppTheme();
  return useMemo(() => createUiStyles(theme), [theme]);
}

export function Screen({ children, title, action, refreshing = false, onRefresh }: PropsWithChildren<{ title: string; action?: ReactNode; refreshing?: boolean; onRefresh?: () => void }>) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View pointerEvents="none" style={styles.glowOne} /><View pointerEvents="none" style={styles.glowTwo} />
    <MobileTopBar title={title} />{action && <View style={styles.pageAction}>{action}</View>}
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined}>{children}</ScrollView>
  </SafeAreaView>;
}

export function Card({ children }: PropsWithChildren) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(theme.spacing.sm));
  useEffect(() => { Animated.parallel([Animated.timing(opacity, { toValue: 1, duration: theme.motion.normal, useNativeDriver: true }), Animated.timing(translateY, { toValue: 0, duration: theme.motion.normal, useNativeDriver: true })]).start(); }, [opacity, theme.motion.normal, translateY]);
  return <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function SectionTitle({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) {
  const ui = useUiStyles(); const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.sectionHeader}><View style={styles.flex}><Text style={ui.heading}>{title}</Text>{caption && <Text style={ui.muted}>{caption}</Text>}</View>{action}</View>;
}

export function Badge({ label, tone = 'info' }: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={[styles.badge, styles[`${tone}Badge`]]}><Text style={[styles.badgeText, styles[`${tone}BadgeText`]]}>{label}</Text></View>;
}

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : theme.colors.primary;
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} /></View>;
}

export function EmptyState({ icon = 'inbox-outline', title, message, action }: { icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; message: string; action?: ReactNode }) {
  const { theme } = useAppTheme(); const ui = useUiStyles(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.empty}><View style={styles.emptyIcon}><MaterialCommunityIcons name={icon} size={theme.sizes.iconLarge} color={theme.colors.primary} /></View><Text style={ui.heading}>{title}</Text><Text style={styles.emptyText}>{message}</Text>{action}</View>;
}

export function Sheet({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const { theme } = useAppTheme(); const ui = useUiStyles(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={ui.between}><Text style={styles.sheetTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.closeButton}><MaterialCommunityIcons name="close" size={theme.sizes.icon} color={theme.colors.muted} /></Pressable></View><ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">{children}</ScrollView></View></View></Modal>;
}

export function ChoiceChips({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (value: string) => void }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.chips}>{options.map((option) => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={[styles.chip, value === option.value && styles.chipActive]}><Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>{option.label}</Text></Pressable>)}</View>;
}

export function Field(props: TextInputProps & { label: string }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput accessibilityLabel={props.accessibilityLabel || props.label} placeholderTextColor={theme.colors.subtle} {...props} style={[styles.input, props.style]} /></View>;
}

export function Button({ label, onPress, loading, variant = 'primary', disabled }: { label: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }} disabled={disabled || loading} onPress={() => { void (variant === 'danger' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); onPress(); }} style={({ pressed }) => [styles.button, styles[variant], (pressed || disabled) && styles.buttonPressed]}>
    {variant === 'primary' ? <LinearGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>{loading ? <ActivityIndicator color={theme.colors.onBrand} /> : <Text style={styles.buttonText}>{label}</Text>}</LinearGradient> : loading ? <ActivityIndicator color={variant === 'danger' ? theme.colors.onBrand : theme.colors.primary} /> : <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}>{label}</Text>}
  </Pressable>;
}

export function StateMessage({ message, loading }: { message: string; loading?: boolean }) {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.state}>{loading && <ActivityIndicator color={theme.colors.primary} />}<Text style={styles.stateText}>{message}</Text></View>;
}

export function SkeletonCard() {
  const { theme } = useAppTheme(); const styles = useMemo(() => createStyles(theme), [theme]);
  return <View accessibilityLabel="Đang tải" style={styles.card}><View style={[styles.skeleton, styles.skeletonShort]} /><View style={[styles.skeleton, styles.skeletonLong]} /><View style={[styles.skeleton, styles.skeletonMedium]} /></View>;
}

const createUiStyles = (theme: AppTheme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + theme.spacing.xs },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm + theme.spacing.xs },
  heading: { color: theme.colors.text, fontSize: theme.typography.title, fontWeight: '800', letterSpacing: -0.3 },
  text: { color: theme.colors.text, fontSize: theme.typography.body, fontWeight: '600' },
  muted: { color: theme.colors.muted, fontSize: theme.typography.bodySmall, lineHeight: 19 },
  amount: { color: theme.colors.text, fontSize: theme.typography.display - 2, fontWeight: '900', letterSpacing: -1 },
  positive: { color: theme.colors.success }, negative: { color: theme.colors.danger }, gap: { gap: theme.spacing.sm + theme.spacing.xs },
});

const createStyles = (theme: AppTheme) => StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: theme.colors.background, overflow: 'hidden' },
  glowOne: { position: 'absolute', width: 260, height: 260, borderRadius: theme.radius.pill, backgroundColor: theme.colors.glowPrimary, top: -180, right: 0, opacity: 0.75 },
  glowTwo: { position: 'absolute', width: 220, height: 220, borderRadius: theme.radius.pill, backgroundColor: theme.colors.glowSecondary, bottom: 40, left: 0, opacity: 0.55 },
  content: { paddingHorizontal: theme.sizes.screenGutter, paddingTop: theme.spacing.xxs, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm + theme.spacing.xs },
  pageAction: { position: 'absolute', right: theme.spacing.lg, top: 92, zIndex: 5 },
  card: { backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: theme.spacing.md + 1, gap: theme.spacing.sm + theme.spacing.xs, shadowColor: theme.colors.shadow, shadowOpacity: theme.dark ? 0.22 : 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  field: { gap: theme.spacing.sm - 1 }, label: { color: theme.colors.muted, fontSize: theme.typography.bodySmall, fontWeight: '600' },
  input: { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md - 1, paddingVertical: theme.spacing.sm + 5, fontSize: theme.typography.body + 1, shadowColor: theme.colors.shadow, shadowOpacity: 0.04, shadowRadius: 6 },
  button: { minHeight: theme.sizes.button, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  buttonGradient: { minHeight: theme.sizes.button, width: '100%', paddingHorizontal: theme.spacing.md + 2, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: theme.colors.primaryStrong, shadowColor: theme.colors.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  secondary: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border }, danger: { backgroundColor: theme.colors.danger },
  buttonText: { color: theme.colors.onBrand, fontSize: theme.typography.body, fontWeight: '700' }, secondaryText: { color: theme.colors.text }, buttonPressed: { opacity: 0.65 },
  state: { padding: theme.spacing.lg + theme.spacing.xs, alignItems: 'center', gap: theme.spacing.sm + theme.spacing.xs }, stateText: { color: theme.colors.muted, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm + theme.spacing.xs, marginTop: theme.spacing.xs + 1 },
  badge: { borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.sm + 1, paddingVertical: theme.spacing.xs, borderWidth: 1 }, badgeText: { fontSize: theme.typography.caption - 1, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoBadge: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primaryBorder }, infoBadgeText: { color: theme.colors.primaryStrong },
  successBadge: { backgroundColor: theme.colors.successSoft, borderColor: theme.colors.successBorder }, successBadgeText: { color: theme.colors.successStrong },
  warningBadge: { backgroundColor: theme.colors.warningSoft, borderColor: theme.colors.warningBorder }, warningBadgeText: { color: theme.colors.warningStrong },
  dangerBadge: { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.dangerBorder }, dangerBadgeText: { color: theme.colors.danger },
  neutralBadge: { backgroundColor: theme.colors.neutralSoft, borderColor: theme.colors.border }, neutralBadgeText: { color: theme.colors.muted },
  progressTrack: { height: theme.spacing.sm + 1, borderRadius: theme.radius.pill, backgroundColor: theme.colors.neutralSoft, overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: theme.radius.pill },
  empty: { alignItems: 'center', paddingVertical: theme.spacing.xl + theme.spacing.xxs, paddingHorizontal: theme.spacing.md + theme.spacing.xxs, gap: theme.spacing.sm + 1 },
  emptyIcon: { width: 58, height: 58, borderRadius: theme.radius.lg - 2, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft }, emptyText: { color: theme.colors.muted, fontSize: theme.typography.bodySmall, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', minHeight: 260, backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, paddingTop: theme.spacing.sm + 2, paddingHorizontal: theme.spacing.md + 2, paddingBottom: theme.spacing.lg + theme.spacing.xs },
  sheetHandle: { width: theme.sizes.sheetHandle, height: 5, borderRadius: theme.radius.pill, backgroundColor: theme.colors.borderStrong, alignSelf: 'center', marginBottom: theme.spacing.sm + 6 }, sheetTitle: { color: theme.colors.text, fontSize: theme.typography.heading, fontWeight: '900', letterSpacing: -0.5 },
  closeButton: { width: 38, height: 38, borderRadius: theme.radius.md - 2, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.neutralSoft }, sheetContent: { paddingVertical: theme.spacing.md + 1, gap: theme.spacing.sm + 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }, chip: { paddingHorizontal: theme.spacing.sm + 5, paddingVertical: theme.spacing.sm + 1, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, chipActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }, chipText: { color: theme.colors.muted, fontSize: theme.typography.bodySmall - 1, fontWeight: '700' }, chipTextActive: { color: theme.colors.primaryStrong },
  skeleton: { borderRadius: theme.spacing.sm, backgroundColor: theme.colors.neutralSoft }, skeletonShort: { width: '42%', height: 15 }, skeletonLong: { width: '78%', height: 12 }, skeletonMedium: { width: '58%', height: 12 },
});
