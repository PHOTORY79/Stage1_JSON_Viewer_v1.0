/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0D0D0D',
        'bg-secondary': '#1A1A1A',
        'bg-tertiary': '#2D2D2D',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0A0',
        'accent-purple': '#B14EFF',
        'accent-purple-dark': '#8B3ECC',
        'accent-red': '#E50914',
        'accent-green': '#46D369',
        'border-color': '#333333',
      },
      fontFamily: {
        'sans': ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(177, 78, 255, 0.4)',
        'glow-red': '0 0 20px rgba(229, 9, 20, 0.4)',
      },
    },
  },
  plugins: [],
}
