/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
        danger:  { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
      },
      fontFamily: {
        sans: ['Assistant', 'Manrope', 'system-ui', 'sans-serif'],
        hebrew: ['Assistant', 'Rubik', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
