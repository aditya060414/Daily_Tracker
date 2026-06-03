/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#0f0f0f',
        panel: '#161616',
        card: '#1a1a1a',
        border: '#2a2a2a',
        accent: '#7c3aed', // committing to electric violet (#7c3aed)
        'accent-dim': '#5b21b6',
        'off-white': '#e8e8e8',
        'off-white-muted': '#a3a3a3',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
