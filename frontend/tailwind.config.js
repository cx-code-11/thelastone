/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f3f0',
          100: '#e8e4dd',
          200: '#d4cdc2',
          300: '#b5ab9c',
          400: '#928475',
          500: '#786a5c',
          600: '#645749',
          700: '#52463c',
          800: '#453c34',
          900: '#1a1510',
          950: '#0d0a07',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        }
      },
    },
  },
  plugins: [],
}
