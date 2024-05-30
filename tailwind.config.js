/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,vue}",
    "./src/*.{html,vue}",
    "./toastBottom/*.html",
    "./toastTop/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
}