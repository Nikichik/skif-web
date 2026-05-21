/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: 'rgb(var(--panel-bg) / <alpha-value>)',
          card: 'rgb(var(--panel-card) / <alpha-value>)',
          border: 'rgb(var(--panel-border) / <alpha-value>)',
        },
        status: {
          ok: '#22C55E',
          warn: '#EAB308',
          fault: '#EF4444',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
