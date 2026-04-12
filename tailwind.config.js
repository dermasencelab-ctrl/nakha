/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',      // برتقالي أساسي
        secondary: '#F7C59F',    // بيج
        dark: '#3D2817',         // بني داكن
        cream: '#FFF8F0',        // أبيض كريمي
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
