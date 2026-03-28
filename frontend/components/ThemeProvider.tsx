"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isReady: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "foodhub-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    setThemeState(initialTheme);
    setIsReady(true);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    isReady,
    setTheme(nextTheme) {
      setThemeState(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    },
    toggleTheme() {
      const nextTheme = theme === "dark" ? "light" : "dark";
      setThemeState(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
  }), [isReady, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
