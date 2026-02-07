import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgba(24, 24, 27, 0.8)',
          light: 'rgba(255, 255, 255, 0.8)',
        },
        'group-weather': '#06b6d4',
        'group-traffic': '#f97316',
        'group-statistics': '#3b82f6',
        'group-media': '#f59e0b',
      },
      animation: {
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'expand': 'expand 200ms ease-out',
        'collapse': 'collapse 200ms ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        slideDown: {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        expand: {
          from: { opacity: '0', height: '0' },
          to: { opacity: '1', height: 'var(--expand-height)' },
        },
        collapse: {
          from: { opacity: '1', height: 'var(--expand-height)' },
          to: { opacity: '0', height: '0' },
        },
      },
      backdropBlur: {
        xl: '24px',
      },
    },
  },
  plugins: [],
} satisfies Config;
