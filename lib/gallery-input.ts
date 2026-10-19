export const GALLERY_BATCH_LIMIT = 50;
export const GALLERY_FILE_LIMIT = 4 * 1024 * 1024;
export const GALLERY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export function galleryFileError(file: { name: string; type: string; size: number }): string | null {
  if (!GALLERY_IMAGE_TYPES.includes(file.type)) return "Use a JPEG, PNG, WebP or AVIF photo.";
  if (!file.size) return "The selected file is empty.";
  if (file.size > GALLERY_FILE_LIMIT) return "Each photo must be 4 MB or smaller.";
  return null;
}
/** Check actual signatures as well as the browser's editable MIME type. */
export function gallerySignature(bytes: Uint8Array, type: string): boolean {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value);
  if (type === "image/webp") return bytes.length >= 12 && text(0,4) === "RIFF" && text(8,12) === "WEBP";
  if (type === "image/avif") return bytes.length >= 16 && text(4,8) === "ftyp" && ["avif", "avis"].some(brand => text(8,Math.min(bytes.length,64)).includes(brand));
  return false;
}
