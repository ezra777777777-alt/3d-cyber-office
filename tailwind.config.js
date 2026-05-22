/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0a1a',
          panel: '#111128',
          border: '#1e1e3f',
          accent: '#00f0ff',
          accent2: '#b347ea',
          warning: '#f0a500',
          danger: '#ff3366',
          success: '#00e676',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
