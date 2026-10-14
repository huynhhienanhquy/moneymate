import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import { Text } from './design-text';
import { AppIcon, type AppIconName } from './app-icon';
import { useAppTheme } from '@/theme';
import Svg, { Circle } from 'react-native-svg';

export function Ring({
  segments,
  size = 128,
  width = 17,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  width?: number;
  children?: ReactNode;
}) {
  const { theme } = useAppTheme();
  const r = (size - width) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={theme.colors.neutralSoft}
          strokeWidth={width}
        />
        {segments.map((segment, index) => {
          const length =
            Math.max(0, Math.min(1, segment.value)) * circumference;
          if (!length) return null;
          const start = segments
            .slice(0, index)
            .reduce(
              (sum, item) =>
                sum + Math.max(0, Math.min(1, item.value)) * circumference,
              0,
            );
          return (
            <Circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth={width}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-start}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceRaised,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <AppIcon name={icon} size={20} color={color || theme.colors.muted} />
    </Pressable>
  );
}

export function SummaryTile({
  label,
  value,
  caption,
  color,
  icon,
  compact = false,
  tinted = false,
}: {
  label: string;
  value: string;
  caption?: string;
  color?: string;
  icon?: AppIconName;
  compact?: boolean;
  tinted?: boolean;
}) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const ink = color || theme.colors.text;
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        padding: compact ? 11 : 15,
        minHeight: compact ? 106 : 122,
        borderRadius: 16,
        gap: 8,
        backgroundColor: tinted
          ? theme.colors.surfaceRaised
          : theme.colors.surface,
        boxShadow: '0px 2px 2px rgba(19,27,46,0.035)',
      }}
    >
      {icon && !compact && (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon} size={19} color={ink} />
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <Text
          numberOfLines={width < 400 ? 2 : 1}
          style={{
            flex: 1,
            color: theme.colors.muted,
            fontWeight: '500',
            fontSize: 13,
          }}
        >
          {label}
        </Text>
        {compact && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color || theme.colors.primaryStrong,
            }}
          />
        )}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color:
            compact && color === theme.colors.danger ? theme.colors.text : ink,
          fontSize: compact
            ? width < 400 && value.length > 8
              ? 16
              : 20
            : value.length > 8
              ? width < 400
                ? 16
                : 21
              : 25,
          fontWeight: '600',
          letterSpacing: -0.3,
        }}
      >
        {value}
      </Text>
      {caption && (
        <Text
          numberOfLines={1}
          style={{
            alignSelf: 'flex-start',
            color: ink,
            fontSize: 12,
            fontWeight: '500',
            backgroundColor: theme.colors.neutralSoft,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
}

export function SectionHeading({
  title,
  caption,
  action,
  icon,
  pill = false,
  style,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
  icon?: AppIconName;
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minHeight: 40,
          marginTop: 5,
        },
        style,
      ]}
    >
      <View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        {icon && (
          <AppIcon name={icon} size={21} color={theme.colors.primaryStrong} />
        )}
        <Text
          style={{ color: theme.colors.text, fontSize: 20, fontWeight: '500' }}
        >
          {title}
        </Text>
        {caption && pill && (
          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 13,
              borderRadius: 12,
              backgroundColor: theme.colors.primarySoft,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            {caption}
          </Text>
        )}
      </View>
      {caption && !pill && (
        <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
          {caption}
        </Text>
      )}
      {action}
    </View>
  );
}

export const categoryAppearance = (name = '') => {
  const label = name.toLocaleLowerCase('vi');
  if (/di chuyển|car|grab/.test(label))
    return {
      icon: 'car-outline' as const,
      color: '#0053DB',
      soft: '#DEE3FF',
      gradient: ['#30C4EF', '#2563EB'] as const,
    };
  if (/ăn|food/.test(label))
    return {
      icon: 'silverware-fork-knife' as const,
      color: '#BE003B',
      soft: '#FFDADD',
      gradient: ['#FFBB19', '#FF8112'] as const,
    };
  if (/mua sắm|shopping/.test(label))
    return {
      icon: 'shopping-outline' as const,
      color: '#BE003B',
      soft: '#FFE1E9',
      gradient: ['#F66ABE', '#F23B67'] as const,
    };
  if (/giáo|học/.test(label))
    return {
      icon: 'school-outline' as const,
      color: '#007652',
      soft: '#AFF8DC',
      gradient: ['#8285FF', '#5846EC'] as const,
    };
  if (/giải trí/.test(label))
    return {
      icon: 'gamepad-variant-outline' as const,
      color: '#0053DB',
      soft: '#DEE3FF',
      gradient: ['#BE7BF9', '#7F38F3'] as const,
    };
  if (/hóa đơn|tiện ích/.test(label))
    return {
      icon: 'flash-outline' as const,
      color: '#BE003B',
      soft: '#FFDADD',
      gradient: ['#FFCE08', '#F8A100'] as const,
    };
  if (/thuê|nhà/.test(label))
    return {
      icon: 'home-outline' as const,
      color: '#007652',
      soft: '#AFF8DC',
      gradient: ['#26C6B7', '#00A281'] as const,
    };
  if (/sức|khỏe/.test(label))
    return {
      icon: 'heart-pulse' as const,
      color: '#BE003B',
      soft: '#FFDADD',
      gradient: ['#FA6473', '#EB1F4C'] as const,
    };
  return {
    icon: 'dots-horizontal' as const,
    color: '#0053DB',
    soft: '#DEE3FF',
    gradient: ['#94A3B8', '#526071'] as const,
  };
};
