/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: {
          base:    '#070b14',
          surface: '#0d1120',
          card:    '#111827',
          hover:   '#1a2236',
        },
        primary: {
          DEFAULT: '#6366f1',
          light:   '#818cf8',
          dark:    '#4f46e5',
          glow:    'rgba(99,102,241,0.35)',
        },
        cyan:   { DEFAULT: '#22d3ee', dim: '#0891b2' },
        green:  { DEFAULT: '#10b981', dim: '#059669' },
        amber:  { DEFAULT: '#f59e0b', dim: '#d97706' },
        red:    { DEFAULT: '#ef4444', dim: '#dc2626' },
        slate: {
          50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', 950: '#020617',
        },
        // backward compat
        ink: {
          50:  '#f1f5f9', 100: '#1a2236', 200: '#1e293b',
          300: '#334155', 400: '#64748b', 500: '#94a3b8',
          600: '#cbd5e1', 700: '#e2e8f0', 800: '#f1f5f9',
          900: '#f8fafc', 950: '#070b14',
        },
        neon: {
          purple: '#6366f1', cyan: '#22d3ee',
          green: '#10b981', amber: '#f59e0b', red: '#ef4444',
        },
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      boxShadow: {
        'indigo': '0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.08)',
        'cyan':   '0 0 20px rgba(34,211,238,0.3)',
        'glass':  '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
