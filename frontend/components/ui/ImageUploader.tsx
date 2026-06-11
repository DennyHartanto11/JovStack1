"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { useUploadMedia } from "@/hooks/useMedia";
import { resolveMediaUrl } from "@/lib/media";

interface Props {
  /** Called with the MediaAsset id after a successful upload. */
  onUploaded: (imageId: string, imageUrl: string) => void;
  /** Currently selected image URL (for preview). */
  currentUrl?: string;
  /** Clear the current selection. */
  onClear?: () => void;
}

/**
 * Inline image uploader for product forms.
 * Uploads the file via POST /media and returns the asset id + url.
 */
export function ImageUploader({ onUploaded, currentUrl, onClear }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia();
  const [error, setError] = useState("");

  const resolvedUrl = resolveMediaUrl(currentUrl);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    upload.mutate(
      { file, type: "Product" },
      {
        onSuccess: (asset) => {
          onUploaded(asset.id, asset.url);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Upload failed.");
        },
      }
    );
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={handleFile}
      />

      {resolvedUrl ? (
        /* ── Preview ── */
        <div className="group relative overflow-hidden rounded-lg border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedUrl}
            alt="Product"
            className="h-48 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Upload size={12} /> Change
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <button
          type="button"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] text-slate-400 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
        >
          {upload.isPending ? (
            <span className="text-sm">Uploading…</span>
          ) : (
            <>
              <ImageIcon size={28} />
              <span className="text-sm font-medium">Click to upload image</span>
              <span className="text-xs text-slate-400">PNG, JPG up to 5 MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
