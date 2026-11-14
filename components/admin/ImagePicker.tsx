"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import media from "@/lib/media.json";
import { uploadImageAction } from "@/app/actions/admin";

const SALON = Object.entries(media)
  .filter(([k]) => k !== "reception-walk")
  .map(([, v]) => (v as { src: string }).src);

export function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const upload = async (f: File) => {
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.set("file", f);
    const r = await uploadImageAction(fd);
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    onChange(r.url);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded bg-ivory">
          {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 space-y-2">
          <input className="field text-sm" placeholder="Image URL (optional)" value={value} onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2 text-xs">
            <button type="button" className="underline" onClick={() => file.current?.click()} disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </button>
            {value && (
              <button type="button" className="text-bad underline" onClick={() => onChange("")}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </div>
      </div>
      {err && <p className="text-xs text-bad">{err}</p>}
      <details className="text-xs">
        <summary className="cursor-pointer text-mute">Or pick a salon photo</summary>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {SALON.map((src) => (
            <button type="button" key={src} onClick={() => onChange(src)} className={`aspect-[3/4] overflow-hidden rounded ${value === src ? "ring-2 ring-plum" : ""}`}>
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
