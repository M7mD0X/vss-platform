/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0f0f13', card: '#18181f', hover: '#1f1f28', input: '#14141a' },
        accent: { DEFAULT: '#6366f1', hover: '#4f46e5', light: '#818cf8' },
        success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { 'from': { opacity: '0' }, 'to': { opacity: '1' } },
        fadeInUp: { 'from': { opacity: '0', transform: 'translateY(12px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
