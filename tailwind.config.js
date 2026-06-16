/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A0A0A',
        chalk: '#F5F0E8',
        blush: '#F2A7C3',
        lemon: '#E8F542',
        grape: '#7B4FD4',
        grain: '#C8B89A',
      },
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
