/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'dm': ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        'gv-orange':       '#C8602A',
        'gv-orange-light': '#E07040',
        'gv-orange-dark':  '#A04820',
        'gv-emerald':      '#1A4A3C',
        'gv-emerald-light':'#2D6B55',
        'gv-cream':        '#F7F2EC',
        'gv-cream-dark':   '#EDE6DA',
        'gv-ink':          '#1C1A17',
        'gv-ink-light':    '#3D3830',
        'gv-muted':        '#8A7E72',
        'gv-white':        '#FEFCF8',
      },
      boxShadow: {
        'card': '0 4px 30px rgba(28,26,23,0.10)',
        'card-hover': '0 16px 50px rgba(28,26,23,0.18)',
        'orange-glow': '0 8px 30px rgba(200,96,42,0.45)',
        'orange-glow-lg': '0 12px 40px rgba(200,96,42,0.55)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out 2s infinite',
        'pulse-dot': 'pulseDot 1.5s infinite',
        'panel-up': 'panelUp 0.3s ease',
        'fade-up': 'fadeUp 0.6s ease both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        panelUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      }
    }
  },
  plugins: [],
}
