/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "rgb(var(--text-slate-50) / <alpha-value>)",
          100: "rgb(var(--text-slate-100) / <alpha-value>)",
          200: "rgb(var(--text-slate-200) / <alpha-value>)",
          300: "rgb(var(--text-slate-300) / <alpha-value>)",
          350: "rgb(var(--text-slate-350) / <alpha-value>)",
          400: "rgb(var(--text-slate-400) / <alpha-value>)",
          500: "rgb(var(--text-slate-500) / <alpha-value>)",
          600: "rgb(var(--text-slate-600) / <alpha-value>)",
          700: "rgb(var(--text-slate-700) / <alpha-value>)",
          800: "rgb(var(--text-slate-800) / <alpha-value>)",
          900: "rgb(var(--text-slate-900) / <alpha-value>)",
          950: "rgb(var(--text-slate-950) / <alpha-value>)",
        },
        blue: {
          200: "rgb(var(--text-blue-200) / <alpha-value>)",
          300: "rgb(var(--text-blue-300) / <alpha-value>)",
          400: "rgb(var(--text-blue-400) / <alpha-value>)",
        }
      }
    }
  },
  plugins: []
};
