/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5865F2",
        success: "#23a559",
        warning: "#f0b232",
        danger: "#f23f42",
        background: "#0f172a",
        "text-main": "#f8fafc",
        "text-muted": "#94a3b8",
      }
    },
  },
  plugins: [],
}
