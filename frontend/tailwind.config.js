import tokens from '@moneymate/design-tokens';
import plugin from 'tailwindcss/plugin.js';

const { webTheme: web } = tokens;
const rgb = (hex) => hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16)).join(' ');
const variables = (colors, prefix) => Object.fromEntries(Object.entries(colors).map(([name, value]) => [`--${prefix}-${name}`, rgb(value)]));
const variableColors = (colors, prefix) => Object.fromEntries(Object.keys(colors).map((name) => [name, `rgb(var(--${prefix}-${name}) / <alpha-value>)`]));
const neutral = {
  50: web.colors['surface-bright'], 100: web.colors['surface-container-low'], 200: web.colors['surface-container'],
  300: web.colors['surface-container-highest'], 400: web.colors.outline, 500: web.colors['on-surface-variant'],
  600: web.colors['on-surface-variant'], 700: web.colors['inverse-surface'], 800: web.colors['inverse-surface'],
  900: web.colors['on-surface'], 950: web.colors['on-surface'],
};
const primaryScale = {
  50: web.colors['surface-container-low'], 100: web.colors['primary-fixed'], 200: web.colors['primary-fixed-dim'],
  300: web.colors['inverse-primary'], 400: web.colors['surface-tint'], 500: web.colors['primary-container'],
  600: web.colors['primary-container'], 700: web.colors.primary, 800: web.colors['on-primary-fixed-variant'],
  900: web.colors['on-primary-fixed'], 950: web.colors['on-primary-fixed'],
};
const secondaryScale = {
  50: '#effcf6', 100: '#d8f8ea', 200: '#aef0d3',
  300: web.colors['secondary-fixed-dim'], 400: web.colors['secondary-container'], 500: '#00845a',
  600: web.colors.secondary, 700: web.colors['on-secondary-container'], 800: web.colors['on-secondary-fixed-variant'],
  900: web.colors['on-secondary-fixed'], 950: web.colors['on-secondary-fixed'],
};
const tertiaryScale = {
  50: '#fff4f5', 100: web.colors['tertiary-fixed'], 200: web.colors['tertiary-fixed-dim'],
  300: web.colors['tertiary-fixed-dim'], 400: web.colors['tertiary-container'], 500: web.colors.tertiary,
  600: web.colors.tertiary, 700: web.colors['on-tertiary-fixed-variant'], 800: web.colors['on-tertiary-fixed-variant'],
  900: web.colors['on-tertiary-fixed'], 950: web.colors['on-tertiary-fixed'],
};
const warningScale = {
  50: '#fff9eb', 100: '#fff1c7', 200: '#ffe08a', 300: '#ffc94d', 400: '#f5aa16',
  500: '#df8700', 600: '#ba6500', 700: '#934a00', 800: '#783b08', 900: '#62320d', 950: '#391a03',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        slate: neutral,
        gray: neutral,
        blue: primaryScale,
        indigo: primaryScale,
        violet: primaryScale,
        emerald: secondaryScale,
        teal: secondaryScale,
        cyan: secondaryScale,
        rose: tertiaryScale,
        pink: tertiaryScale,
        red: tertiaryScale,
        amber: warningScale,
        orange: warningScale,
        brand: primaryScale,
        ...web.colors,
        ui: variableColors(web.light, 'ui'),
        chart: variableColors(web.chartColors, 'chart'),
      },
      fontSize: web.fontSize,
      backgroundImage: web.backgroundImage,
      screens: { xs: '480px' },
      spacing: { ...web.spacing, 4.5: '1.125rem' },
      maxWidth: web.maxWidth,
      width: web.width,
      minWidth: web.minWidth,
      minHeight: web.minHeight,
      maxHeight: web.maxHeight,
      borderRadius: web.borderRadius,
      boxShadow: web.boxShadow,
      letterSpacing: web.letterSpacing,
      lineHeight: web.lineHeight,
      gridTemplateColumns: { overview: 'minmax(0, 2fr) minmax(280px, 1fr)' },
      zIndex: { overlay: '60', notification: '100' },
      scale: { press: '.98', 'press-subtle': '.99' },
      strokeWidth: { 'auth-mark': '2.5' },
      transitionDuration: { fast: `${tokens.motion.fast}ms`, normal: `${tokens.motion.normal}ms`, slow: `${tokens.motion.slow}ms` },
    },
  },
  plugins: [plugin(({ addBase, addUtilities }) => {
    addBase({ ':root': { ...variables(web.light, 'ui'), ...variables(web.chartColors, 'chart') }, '.dark': variables(web.dark, 'ui') });
    addUtilities({ '.word-spacing-title': { wordSpacing: '.22em' } });
  })],
}
