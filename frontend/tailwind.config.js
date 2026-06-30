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
        brand: {
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#89ceff',
          400: '#52b4ff',
          500: '#2a95ff',
          600: '#1475ff',
          700: '#0c5df6',
          800: '#114bc5',
          900: '#14429b',
          950: '#11295e',
        }
      }
    },
  },
  plugins: [],
}
