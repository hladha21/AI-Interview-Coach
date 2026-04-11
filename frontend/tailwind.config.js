/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["DM Serif Display", "serif"],
      },
      colors: {
        bg: {
          1: "#0f0f12",
          2: "#17171c",
          3: "#1e1e26",
          4: "#252530",
        },
        border: {
          1: "#2e2e3a",
          2: "#3a3a4a",
        },
        accent: "#7c6af7",
        "accent-2": "#a395ff",
      },
    },
  },
  plugins: [],
};