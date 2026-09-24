import "server-only";
import type { UploadInput } from "./backend";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOADS = 3;
export const UPLOAD_FIELDS = ["floorPlan", "referenceImage", "roomImage"] as const;

// Only these types are accepted, and the declared type must match the file's
// real signature (magic bytes) — extensions and client MIME types are not trusted.
const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: "application/pdf", ext: "pdf", test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export class UploadError extends Error {}

export async function readUploads(form: FormData): Promise<UploadInput[]> {
  const out: UploadInput[] = [];
  for (const field of UPLOAD_FIELDS) {
    const entry = form.get(field);
    if (!entry || typeof entry === "string" || entry.size === 0) continue;
    if (out.length >= MAX_UPLOADS) throw new UploadError("Too many files.");
    if (entry.size > MAX_UPLOAD_BYTES) throw new UploadError("Each file must be 5 MB or smaller.");
    const bytes = new Uint8Array(await entry.arrayBuffer());
    const sig = SIGNATURES.find((s) => s.test(bytes));
    if (!sig) throw new UploadError("Only PDF, JPG, PNG or WEBP files are allowed.");
    out.push({
      field,
      // Never trust the client file name: rebuild a safe one.
      name: `${field}.${sig.ext}`,
      mimeType: sig.mime,
      base64: Buffer.from(bytes).toString("base64"),
    });
  }
  return out;
}
