"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadSimple } from "@phosphor-icons/react";

interface Props {
  token: string;
  currentStatus: string;
}

export function ReceiptUpload({ token, currentStatus }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Revoke the blob URL when the preview changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      setError("Saiz fail melebihi 5 MB");
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const upload = async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/public/bookings/${token}/receipt`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status === 201) {
        setDone(true);
        router.refresh();
        return;
      }
      if (res.status === 429) { setError("Terlalu banyak permohonan. Cuba sebentar lagi."); return; }
      if (res.status === 409) { setError("Tempahan telah dikemaskini. Muat semula halaman."); return; }
      setError(typeof data?.error === "string" ? data.error : "Gagal memuat naik resit.");
    } catch {
      setError("Ralat sambungan. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3" role="status">
        Resit dimuat naik. Pejabat masjid akan mengesahkan bayaran anda.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 cursor-pointer">
        <UploadSimple className="w-4 h-4" aria-hidden="true" />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" aria-describedby="receipt-upload-error" />
        {currentStatus === "payment_review" ? "Tukar resit" : "Pilih resit bayaran"}
      </label>
      {file && <p className="text-xs text-zinc-500">Dipilih: {file.name}</p>}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Pratonton resit" className="max-h-60 rounded-lg border border-zinc-200" />
      )}
      {error && <p id="receipt-upload-error" className="text-sm text-red-600" role="alert">{error}</p>}
      {file && (
        <button
          type="button"
          onClick={upload}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors tap"
        >
          {loading ? "Memuat naik…" : "Hantar Resit"}
        </button>
      )}
    </div>
  );
}
