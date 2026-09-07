import tokens from '@moneymate/design-tokens';
import plugin from 'tailwindcss/plugin.js';

const { webTheme: web } = tokens;
const rgb = (hex) => hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16)).join(' ');
const variables = (colors, prefix) => Object.fromEntries(Object.entries(colors).map(([name, value]) => [`--${prefix}-${name}`, rgb(value)]));
const variableColors = (colors, prefix) => Object.fromEntries(Object.keys(colors).map((name) => [name, `rgb(var(--${prefix}-${name}) / <alpha-value>)`]));

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
        brand: { ...tokens.palette.brand, 950: '#11295e' },
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
