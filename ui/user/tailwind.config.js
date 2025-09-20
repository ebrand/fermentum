/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fermentum: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad7a5',
          300: '#f6ba6d',
          400: '#f19533',
          500: '#ed7611',
          600: '#de5d07',
          700: '#b84708',
          800: '#93380e',
          900: '#762f0f',
          950: '#401605',
        }
      }
    },
  },
  plugins: [],
}