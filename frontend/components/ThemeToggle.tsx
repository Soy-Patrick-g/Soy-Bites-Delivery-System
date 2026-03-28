"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { isReady, theme, toggleTheme } = useTheme();
  const isDark = isReady ? theme === "dark" : false;
  const nextLabel = isDark ? "☀️ Light mode" : "🌙 Dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream transition hover:bg-white/10"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={nextLabel}
    >
      {nextLabel}
    </button>
  );
}
