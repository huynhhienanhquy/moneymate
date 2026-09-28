export const palette = {
  brand: { 50: '#DBE1FF', 100: '#DBE1FF', 200: '#B4C5FF', 300: '#B4C5FF', 400: '#0053DB', 500: '#2563EB', 600: '#2563EB', 700: '#004AC6', 800: '#003EA8', 900: '#00174B' },
  cyan: '#4EDEA3', violet: '#0053DB', emerald: '#006C49', amber: '#D22348', rose: '#AD0033'
} as const;
export const lightColors = {
  background: '#FAF8FF', surface: '#FFFFFF', surfaceRaised: '#F2F3FF', text: '#131B2E', muted: '#434655', subtle: '#737686',
  border: '#C3C6D7', borderStrong: '#737686', primarySoft: '#DBE1FF', primaryBorder: '#B4C5FF', successSoft: '#6FFBBE', successBorder: '#4EDEA3',
  warningSoft: '#FFDADB', warningBorder: '#FFB2B7', dangerSoft: '#FFDAD6', dangerBorder: '#BA1A1A', neutralSoft: '#EAEDFF',
  overlay: 'rgba(19,27,46,0.52)', glass: 'rgba(255,255,255,0.94)', glowPrimary: '#DBE1FF', glowSecondary: '#6FFBBE', shadow: '#434655',
} as const;
export const darkColors = {
  background: '#131B2E', surface: '#283044', surfaceRaised: '#131B2E', text: '#EEF0FF', muted: '#B4C5FF', subtle: '#C3C6D7',
  border: '#434655', borderStrong: '#737686', primarySoft: '#00174B', primaryBorder: '#003EA8', successSoft: '#002113', successBorder: '#005236',
  warningSoft: '#40000D', warningBorder: '#92002A', dangerSoft: '#40000D', dangerBorder: '#93000A', neutralSoft: '#283044',
  overlay: 'rgba(19,27,46,0.76)', glass: 'rgba(40,48,68,0.96)', glowPrimary: '#00174B', glowSecondary: '#002113', shadow: '#131B2E',
} as const;
export const colors = {
  primary: '#004AC6', primaryStrong: '#003EA8', primaryDeep: '#00174B', cyan: palette.cyan, violet: palette.violet,
  success: '#006C49', successStrong: '#005236', warning: '#D22348', warningStrong: '#AD0033', danger: '#BA1A1A', onBrand: '#FFFFFF', black: '#000000',
} as const;
export const gradients = { brand: ['#004AC6', '#2563EB', '#003EA8'], background: ['#FAF8FF', '#F2F3FF', '#EAEDFF'], darkBackground: ['#131B2E', '#283044', '#131B2E'] } as const;
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
