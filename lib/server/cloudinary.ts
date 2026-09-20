import { v2 as cloudinary } from "cloudinary";

/* Cloudinary, configured from the environment so no key ever lands in the
   repo. Either form works, and CLOUDINARY_URL wins because it is the one
   the Cloudinary dashboard hands you:

     CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

   or the three parts separately:

     CLOUDINARY_CLOUD_NAME
     CLOUDINARY_API_KEY
     CLOUDINARY_API_SECRET

   Only the cloud name is safe to expose publicly; the key and secret stay
   server side, which is why uploads go through /api/uploads rather than
   straight from the browser. */

function readConfig(): { cloudName: string; apiKey: string; apiSecret: string } {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname && parsed.username && parsed.password) {
        return {
          cloudName: parsed.hostname,
          apiKey: decodeURIComponent(parsed.username),
          apiSecret: decodeURIComponent(parsed.password),
        };
      }
    } catch {
      /* fall through to the separate variables */
    }
  }
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  };
}

const config = readConfig();

export const CLOUD_NAME = config.cloudName;

/** False until credentials are present, so callers can fail politely. */
export const cloudinaryConfigured = Boolean(config.cloudName && config.apiKey && config.apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
}

/* Where uploads are allowed to land. An open `folder` parameter would let a
   caller write anywhere in the account, so it is an allowlist. */
export const UPLOAD_FOLDERS = {
  avatars: "ecp/avatars",
  news: "ecp/news",
  events: "ecp/events",
  products: "ecp/products",
  gallery: "ecp/gallery",
  documents: "ecp/documents",
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

export function isUploadFolder(value: string): value is UploadFolder {
  return Object.prototype.hasOwnProperty.call(UPLOAD_FOLDERS, value);
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
/** Documents can be bigger than a photo; scanned minutes often are. */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/* Documents go up as Cloudinary "raw" resources: no transformation, served
   back byte for byte. Browsers are inconsistent about the Office types, so
   the extension is checked as well as the reported MIME. */
export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const ALLOWED_DOCUMENT_EXT = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

/** Uploads a buffer and returns just what the app stores. */
export async function uploadImage(
  buffer: Buffer,
  folder: UploadFolder,
  options: { publicId?: string; overwrite?: boolean } = {},
): Promise<UploadedImage> {
  if (!cloudinaryConfigured) throw new Error("Cloudinary is not configured");

  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDERS[folder],
        public_id: options.publicId,
        overwrite: options.overwrite ?? true,
        resource_type: "image",
        /* Let Cloudinary pick the best format and a sensible quality for
           whoever is asking, rather than shipping the original every time. */
        transformation: [{ fetch_format: "auto", quality: "auto" }],
      },
      (error, uploaded) => {
        if (error || !uploaded) return reject(error ?? new Error("Upload failed"));
        resolve(uploaded as unknown as Record<string, unknown>);
      },
    );
    stream.end(buffer);
  });

  return {
    url: String(result.secure_url),
    publicId: String(result.public_id),
    width: Number(result.width),
    height: Number(result.height),
    format: String(result.format),
    bytes: Number(result.bytes),
  };
}

/** Uploads a document untouched, as a Cloudinary raw resource. */
export async function uploadDocument(
  buffer: Buffer,
  filename: string,
  options: { publicId?: string } = {},
): Promise<UploadedImage> {
  if (!cloudinaryConfigured) throw new Error("Cloudinary is not configured");

  const stem = filename.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").toLowerCase();
  const publicId = options.publicId ?? `${UPLOAD_FOLDERS.documents}/${stem}-${Date.now().toString(36)}`;

  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: "raw", overwrite: true },
      (error, uploaded) => {
        if (error || !uploaded) return reject(error ?? new Error("Upload failed"));
        resolve(uploaded as unknown as Record<string, unknown>);
      },
    );
    stream.end(buffer);
  });

  return {
    url: String(result.secure_url),
    publicId: String(result.public_id),
    width: 0,
    height: 0,
    format: String(result.format ?? filename.split(".").pop() ?? ""),
    bytes: Number(result.bytes),
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!cloudinaryConfigured) throw new Error("Cloudinary is not configured");
  await cloudinary.uploader.destroy(publicId);
}

export async function deleteDocument(publicId: string): Promise<void> {
  if (!cloudinaryConfigured) throw new Error("Cloudinary is not configured");
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export { cloudinary };
