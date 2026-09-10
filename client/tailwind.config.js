/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0a0b10',
        navy: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
        },
        cyber: {
          cyan: '#06b6d4',
          cyanLight: '#22d3ee',
          emerald: '#10b981',
          emeraldLight: '#34d399',
          crimson: '#ef4444',
          amber: '#f59e0b',
          violet: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'scanline': 'scanline 2.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scanline: {
          '0%, 100%': { top: '0%' },
          '50%': { top: '95%' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.6))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.9))' },
        }
      }
    },
  },
  plugins: [],
}
