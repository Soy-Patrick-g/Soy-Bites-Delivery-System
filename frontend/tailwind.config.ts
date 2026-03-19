import type { Config } from "tailwindcss";

const config: Config = {
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
        ink: "#1e1b18"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-display)", "serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(33, 22, 14, 0.12)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
