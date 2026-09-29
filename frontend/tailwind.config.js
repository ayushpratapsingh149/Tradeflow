/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5bafd',
          400: '#8193fb',
          500: '#6271f5',
          600: '#4f56e8',
          700: '#4044cd',
          800: '#3538a5',
          900: '#303482',
          950: '#1c1d4d',
        },
        surface: {
          DEFAULT: '#0f1117',
          50:  '#1a1d27',
          100: '#13151f',
          200: '#0f1117',
          300: '#0b0d13',
        },
        border: {
          DEFAULT: '#1e2130',
          light: '#252839',
        },
      },
      fontFamily: {
        sans:  ['\'DM Sans\'', 'system-ui', 'sans-serif'],
        mono:  ['\'JetBrains Mono\'', 'monospace'],
        display: ['\'Cabinet Grotesk\'', '\'DM Sans\'', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
