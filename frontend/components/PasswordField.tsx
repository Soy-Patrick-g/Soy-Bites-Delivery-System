"use client";

import { useState } from "react";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function PasswordField({ label, value, onChange, className }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-2 block text-sm font-medium text-ink/70">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-cream px-4 py-3">
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-olive"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
