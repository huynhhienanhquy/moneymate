export const palette = {
  brand: { 50: '#EEF8FF', 100: '#D8EEFF', 200: '#B9E0FF', 300: '#89CEFF', 400: '#52B4FF', 500: '#2A95FF', 600: '#1475FF', 700: '#0C5DF6', 800: '#114BC5', 900: '#14429B' },
  cyan: '#06B6D4', violet: '#8B5CF6', emerald: '#10B981', amber: '#F59E0B', rose: '#F43F5E'
} as const;
export const lightColors = { background: '#F4F8FF', surface: '#FFFFFF', surfaceRaised: '#F8FAFC', text: '#172033', muted: '#64748B', subtle: '#94A3B8', border: '#DCE7F5', primarySoft: '#EAF5FF', successSoft: '#ECFDF5', dangerSoft: '#FFF1F2' } as const;
export const darkColors = { background: '#070B14', surface: '#111827', surfaceRaised: '#182235', text: '#F1F5F9', muted: '#A5B4C7', subtle: '#7C8CA3', border: '#29364A', primarySoft: '#102C4D', successSoft: '#0B3026', dangerSoft: '#3B1521' } as const;
export const colors = { primary: palette.brand[500], primaryStrong: palette.brand[600], cyan: palette.cyan, violet: palette.violet, success: palette.emerald, warning: palette.amber, danger: palette.rose } as const;
export const gradients = { brand: [palette.brand[600], palette.brand[500], palette.cyan], background: ['#F4F8FF', '#F0FAFC', '#FAF5FF'], darkBackground: ['#070B14', '#0B1120', '#0D0E1A'] } as const;
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 30, pill: 999 } as const;
export const typography = { caption: 11, bodySmall: 13, body: 15, title: 18, heading: 22, display: 30 } as const;
export const motion = { fast: 120, normal: 200, slow: 300 } as const;
export const touchTarget = 44;
