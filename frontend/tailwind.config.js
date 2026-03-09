/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c1d3fe',
          300: '#92b3fd',
          400: '#5c89fa',
          500: '#345df1',
          600: '#233fe4',
          700: '#1c31d1',
          800: '#1d2aad',
          900: '#1d2889',
          950: '#161a53',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        sleep: {
          50: '#f4f4ff',
          100: '#ebebff',
          200: '#d9d9ff',
          300: '#b8b8ff',
          400: '#9191ff',
          500: '#6666ff',
          600: '#4d4dff',
          700: '#3b3bff',
          800: '#3232cc',
          900: '#2a2a99',
          950: '#1a1a5c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}