/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50',
        accent: '#3498db',
        bgGray: '#f1f3f6',
      },
    },
  },
  plugins: [],
}
