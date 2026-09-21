export const palette = {
  brand: { 50: '#EEF8FF', 100: '#D8EEFF', 200: '#B9E0FF', 300: '#89CEFF', 400: '#52B4FF', 500: '#2A95FF', 600: '#1475FF', 700: '#0C5DF6', 800: '#114BC5', 900: '#14429B' },
  cyan: '#06B6D4', violet: '#8B5CF6', emerald: '#10B981', amber: '#F59E0B', rose: '#F43F5E'
} as const;
export const lightColors = {
  background: '#F4F8FF', surface: '#FFFFFF', surfaceRaised: '#F8FAFC', text: '#172033', muted: '#64748B', subtle: '#94A3B8',
  border: '#DCE7F5', borderStrong: '#CBD5E1', primarySoft: '#EAF5FF', primaryBorder: '#B9E0FF', successSoft: '#ECFDF5', successBorder: '#BBF7D0',
  warningSoft: '#FFFBEB', warningBorder: '#FDE68A', dangerSoft: '#FFF1F2', dangerBorder: '#FECDD3', neutralSoft: '#F1F5F9',
  overlay: 'rgba(15,23,42,0.52)', glass: 'rgba(255,255,255,0.94)', glowPrimary: '#DDF1FF', glowSecondary: '#F1EAFE', shadow: '#64748B',
} as const;
export const darkColors = {
  background: '#070B14', surface: '#111827', surfaceRaised: '#182235', text: '#F1F5F9', muted: '#A5B4C7', subtle: '#7C8CA3',
  border: '#29364A', borderStrong: '#475569', primarySoft: '#102C4D', primaryBorder: '#1E4D78', successSoft: '#0B3026', successBorder: '#166534',
  warningSoft: '#3A2A0B', warningBorder: '#854D0E', dangerSoft: '#3B1521', dangerBorder: '#881337', neutralSoft: '#1E293B',
  overlay: 'rgba(2,6,23,0.76)', glass: 'rgba(17,24,39,0.96)', glowPrimary: '#102C4D', glowSecondary: '#24143D', shadow: '#020617',
} as const;
export const colors = {
  primary: palette.brand[500], primaryStrong: palette.brand[600], primaryDeep: palette.brand[700], cyan: palette.cyan, violet: palette.violet,
  success: palette.emerald, successStrong: '#059669', warning: palette.amber, warningStrong: '#D97706', danger: palette.rose, onBrand: '#FFFFFF', black: '#000000',
} as const;
export const gradients = { brand: [palette.brand[600], palette.brand[500], palette.cyan], background: ['#F4F8FF', '#F0FAFC', '#FAF5FF'], darkBackground: ['#070B14', '#0B1120', '#0D0E1A'] } as const;
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 30, pill: 999 } as const;
export const typography = { caption: 11, bodySmall: 13, body: 15, title: 18, heading: 22, display: 30 } as const;
export const motion = { fast: 120, normal: 200, slow: 300 } as const;
export const touchTarget = 44;
export const componentSizes = {
  iconSmall: 18, icon: 22, iconLarge: 28, avatar: 40, featureTile: 50, topbar: 66, button: 50, drawerMax: 320, sheetHandle: 42,
  chart: 160, donut: 210, screenGutter: 16, contentMax: 430,
} as const;
export { webTheme } from './web';
