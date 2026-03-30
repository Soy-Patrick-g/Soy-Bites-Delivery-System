"use client";

import { useRef } from "react";
import { StarRatingDisplay } from "@/components/StarRatingDisplay";

type StarRatingInputProps = {
  id: string;
  value: number;
  onChange: (value: number) => void;
};

export function StarRatingInput({ id, value, onChange }: StarRatingInputProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function updateFromPointer(clientX: number) {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const bounds = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const nextValue = Math.max(1, roundToTenth(ratio * 5));
    onChange(nextValue);
  }

  return (
    <div className="space-y-3">
      <div
        ref={trackRef}
        role="presentation"
        className="inline-flex cursor-pointer rounded-full bg-cream px-4 py-3"
        onClick={(event) => updateFromPointer(event.clientX)}
        onMouseMove={(event) => {
          if ((event.buttons & 1) === 1) {
            updateFromPointer(event.clientX);
          }
        }}
      >
        <StarRatingDisplay rating={value} sizeClassName="h-7 w-7" showValue />
      </div>
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm text-ink/68">
          Drag the slider or click the stars to set a rating between 1.0 and 5.0.
        </label>
        <input
          id={id}
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={value}
          onChange={(event) => onChange(roundToTenth(Number(event.target.value)))}
          className="w-full accent-[#AB3C27]"
        />
      </div>
    </div>
  );
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}
