"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
};

export function Avatar({ name, src, className, imageClassName }: AvatarProps) {
  const gradientId = useId();
  const initials = getInitials(name);

  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-full bg-cream", className)}>
        <img src={src} alt={name} className={cn("h-full w-full object-cover", imageClassName)} />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-full bg-cream", className)} aria-label={`${name} avatar`}>
      <svg viewBox="0 0 96 96" className="h-full w-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#D6B268" />
            <stop offset="100%" stopColor="#AB3C27" />
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="48" fill="#1e1b18" />
        <circle cx="48" cy="48" r="46" fill={`url(#${gradientId})`} opacity="0.22" />
        <circle cx="48" cy="40" r="18" fill="#FFF6EA" opacity="0.92" />
        <path d="M24 83c3.3-12.6 13.9-20.8 24-20.8S68.7 70.4 72 83" fill="#FFF6EA" opacity="0.92" />
        <text x="48" y="54" textAnchor="middle" fontSize="26" fontWeight="700" fill="#1e1b18" fontFamily="var(--font-sans)">
          {initials}
        </text>
      </svg>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "FH";
}
