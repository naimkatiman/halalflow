export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMime = (typeof ALLOWED_IMAGE_MIME)[number];

type Result = { ok: true; mime: AllowedMime } | { ok: false; error: string };

function sniff(bytes: Uint8Array): AllowedMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** Validate a candidate image upload by size, declared mime, and magic bytes. */
export function validateImageUpload(bytes: Uint8Array, declaredMime: string): Result {
  if (bytes.length === 0) return { ok: false, error: "Fail kosong" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "Saiz fail melebihi 5 MB" };
  if (!ALLOWED_IMAGE_MIME.includes(declaredMime as AllowedMime)) {
    return { ok: false, error: "Hanya imej JPG, PNG atau WEBP dibenarkan" };
  }
  const sniffed = sniff(bytes);
  if (sniffed !== declaredMime) return { ok: false, error: "Fail imej tidak sah" };
  return { ok: true, mime: sniffed };
}
