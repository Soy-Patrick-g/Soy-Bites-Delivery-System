"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { isReady, theme, toggleTheme } = useTheme();
  const isDark = isReady ? theme === "dark" : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream transition hover:bg-white/10"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
