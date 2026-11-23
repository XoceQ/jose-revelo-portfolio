/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', md: '2rem' }, screens: { '2xl': '1200px' } },
    extend: {
      colors: {
        sky: { brand: '#38BDF8' },
        primary: '#0EA5E9',
        navy: '#0F172A',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: 'var(--accent-text)',
        page: 'var(--bg)',
        soft: 'var(--bg-soft)',
        surface: 'var(--surface)',
        line: 'var(--line)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -16px rgb(15 23 42 / 0.18)',
        lift: '0 2px 4px rgb(15 23 42 / 0.05), 0 20px 40px -24px rgb(14 165 233 / 0.4)',
      },
    },
  },
  plugins: [],
};
