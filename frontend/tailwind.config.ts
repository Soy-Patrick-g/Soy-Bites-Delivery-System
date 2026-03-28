import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ember: "#ab3c27",
        citrus: "#efb736",
        olive: "#4d6b4d",
        cream: "#f8f1e3",
        ink: "#1e1b18",
        luxury: "rgb(var(--color-luxury) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-display)", "serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(var(--shadow-color), 0.18)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
