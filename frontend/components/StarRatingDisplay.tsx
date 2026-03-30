"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type StarRatingDisplayProps = {
  rating: number;
  sizeClassName?: string;
  className?: string;
  showValue?: boolean;
};

export function StarRatingDisplay({
  rating,
  sizeClassName = "h-4 w-4",
  className,
  showValue = false
}: StarRatingDisplayProps) {
  const gradientPrefix = useId();
  const safeRating = clampRating(rating);

  return (
    <div className={cn("inline-flex items-center gap-2", className)} aria-label={`${safeRating.toFixed(1)} out of 5 stars`}>
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = Math.max(0, Math.min(1, safeRating - index));
          const gradientId = `${gradientPrefix}-${index}`;

          return (
            <svg
              key={gradientId}
              viewBox="0 0 24 24"
              className={cn(sizeClassName, "shrink-0")}
              aria-hidden="true"
              fill={`url(#${gradientId})`}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset={`${fill * 100}%`} stopColor="#EFB736" />
                  <stop offset={`${fill * 100}%`} stopColor="rgba(30, 27, 24, 0.14)" />
                </linearGradient>
              </defs>
              <path d="m12 3.3 2.74 5.54 6.12.89-4.43 4.32 1.05 6.1L12 17.3l-5.48 2.88 1.05-6.1L3.14 9.73l6.12-.89L12 3.3Z" />
            </svg>
          );
        })}
      </div>
      {showValue ? <span className="text-sm font-semibold text-ink">{safeRating.toFixed(1)}</span> : null}
    </div>
  );
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(5, value));
}
