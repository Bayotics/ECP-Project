"use client";

/* Pick an image, send it to /api/uploads, hand the caller back the hosted
   URL. The file goes to our own route rather than straight to Cloudinary so
   the API secret stays on the server. */

import { useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

export type UploadFolder = "avatars" | "news" | "events" | "products" | "gallery" | "documents";

type Uploaded = { url: string; publicId: string; width: number; height: number };

export default function ImageUploader({
  value,
  onChange,
  folder = "avatars",
  label = "Image",
  hint,
  shape = "square",
  className,
}: {
  value?: string;
  onChange: (url: string, meta?: Uploaded) => void;
  folder?: UploadFolder;
  label?: string;
  hint?: string;
  shape?: "square" | "wide";
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = (await res.json()) as { ok: boolean; data?: Uploaded; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? "Upload failed");
      onChange(json.data.url, json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">{label}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50",
            shape === "square" ? "h-28 w-28" : "h-28 w-48",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-neutral-400">No image</span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-neutral-700">
              Uploading…
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center rounded-full px-5 py-2 text-sm font-normal text-white transition-opacity disabled:opacity-60"
              style={{ background: EKO.green }}
            >
              {value ? "Replace image" : "Choose image"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={busy}
                className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-normal text-neutral-800 transition-colors hover:border-neutral-400"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-xs leading-6 text-neutral-500">
            {hint ?? "JPEG, PNG, WebP or AVIF, up to 8 MB. Stored on Cloudinary and served at the size each page needs."}
          </p>
          {error && <p className="text-xs leading-6 text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void send(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
