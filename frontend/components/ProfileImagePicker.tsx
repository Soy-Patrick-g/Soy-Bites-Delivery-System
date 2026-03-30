"use client";

import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CameraIcon, UploadIcon } from "@/components/icons";
import { uploadProfileImage } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

type ProfileImagePickerProps = {
  name: string;
  imageUrl?: string;
  onChange: (imageUrl?: string) => void;
  title?: string;
  description?: string;
};

export function ProfileImagePicker({
  name,
  imageUrl,
  onChange,
  title = "Profile picture",
  description = "Upload a profile picture now or continue with the default avatar."
}: ProfileImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const uploaded = await uploadProfileImage(file);
      onChange(uploaded.url);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "We couldn’t upload that profile image right now.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="rounded-[28px] border border-ink/10 bg-cream/70 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={name || APP_NAME} src={imageUrl} className="h-24 w-24 border border-white/60" />
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-olive">{title}</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">{description}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white"
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  Upload photo
                </>
              )}
            </label>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              <CameraIcon className="h-4 w-4" />
              Use default avatar
            </button>
          </div>
        </div>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
      />

      {error ? <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
