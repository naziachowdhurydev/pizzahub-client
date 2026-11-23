"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { normalizeOptionalImageUrl } from "@/lib/image-url";

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function AvatarInput({
  value,
  onChange,
  disabled = false,
  id = "avatar",
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  id?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const displayedUrl =
    draftUrl ?? (value && !value.startsWith("data:") ? value : "");

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    setError("");

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Choose an image smaller than 2 MB.");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read that image."));
        reader.readAsDataURL(file);
      });
      setDraftUrl(null);
      onChange(normalizeOptionalImageUrl(dataUrl));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Could not read that image.",
      );
    }
  }

  function handleUrlChange(next: string) {
    setDraftUrl(next);
    setError("");
    if (!next.trim()) {
      onChange(null);
      return;
    }
    try {
      onChange(normalizeOptionalImageUrl(next));
    } catch {
      // Wait until blur so the user can finish typing a valid URL.
    }
  }

  function handleUrlBlur() {
    if (draftUrl === null) return;
    if (!draftUrl.trim()) {
      onChange(null);
      setDraftUrl(null);
      return;
    }
    try {
      onChange(normalizeOptionalImageUrl(draftUrl));
      setDraftUrl(null);
      setError("");
    } catch (urlError) {
      setError(urlError instanceof Error ? urlError.message : "Invalid image URL.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted">
          {value ? (
            <img src={value} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={24} className="text-muted-foreground" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            id={`${id}-file`}
            type="file"
            accept={ACCEPTED_FILE_TYPES.join(",")}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold transition hover:border-[#F26B4F] hover:text-[#F26B4F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus size={16} aria-hidden="true" />
            Upload image
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setDraftUrl(null);
                onChange(null);
                setError("");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      <label htmlFor={`${id}-url`} className="block text-sm font-semibold">
        Or paste an image URL
        <span className="font-normal text-muted-foreground"> (optional)</span>
        <input
          id={`${id}-url`}
          type="url"
          value={displayedUrl}
          disabled={disabled}
          placeholder="https://example.com/avatar.jpg"
          onChange={(event) => handleUrlChange(event.target.value)}
          onBlur={handleUrlBlur}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal text-foreground outline-none transition focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </label>

      {value?.startsWith("data:") && (
        <p className="text-xs text-muted-foreground">
          Uploaded image will be saved with your account data in MongoDB.
        </p>
      )}
      {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
    </div>
  );
}
