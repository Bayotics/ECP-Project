"use client";

/* Pick a document, send it to /api/uploads, hand the caller back the hosted
   URL, its public id and its real size in bytes. Same route as the image
   uploader, which routes the `documents` folder to a Cloudinary raw upload
   so a PDF comes back byte for byte. */

import { useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";
import { formatFileSize } from "@/lib/models/document";

export type UploadedFile = {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  originalName: string;
};

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,application/pdf";

export default function FileUploader({
  value,
  fileName,
  sizeBytes,
  onChange,
  label = "File",
  hint,
  className,
}: {
  value?: string;
  fileName?: string;
  sizeBytes?: number;
  onChange: (file: UploadedFile | null) => void;
  label?: string;
  hint?: string;
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
      body.append("folder", "documents");
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = (await res.json()) as { ok: boolean; data?: UploadedFile; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? "Upload failed");
      onChange(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const size = formatFileSize(sizeBytes);

  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">{label}</p>

      <div className="rounded-2xl border border-neutral-200 p-4">
        {value ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm font-normal text-green-700 hover:underline"
              >
                {fileName ?? "Uploaded file"}
              </a>
              <p className="mt-0.5 text-xs text-neutral-900">{size ?? "Size N/A"}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-normal text-neutral-900 transition-colors hover:border-neutral-400"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                disabled={busy}
                className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-normal text-neutral-900 transition-colors hover:border-neutral-400"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-900">{busy ? "Uploading…" : "No file attached yet."}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-normal text-white transition-opacity disabled:opacity-60",
              )}
              style={{ background: EKO.green }}
            >
              Choose file
            </button>
          </div>
        )}

        <p className="mt-3 text-xs leading-6 text-neutral-900">
          {hint ?? "PDF, Word or Excel, up to 25 MB. The size is read from the file, not typed in."}
        </p>
        {error && <p className="mt-1 text-xs leading-6 text-red-700">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
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
