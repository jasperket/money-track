/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      serif: ["'Source Serif 4'", "serif"],
    },
  },
  safelist: ["col-span-12", "sm:col-span-6", "2xl:col-span-4"],
  plugins: [],
};
