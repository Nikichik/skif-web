/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: '#0A1628',
          card: '#111D33',
          border: '#1E3050',
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
