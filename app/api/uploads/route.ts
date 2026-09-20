import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guards";
import {
  ALLOWED_DOCUMENT_EXT,
  ALLOWED_DOCUMENT_MIME,
  ALLOWED_MIME,
  MAX_DOCUMENT_BYTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_FOLDERS,
  cloudinaryConfigured,
  deleteDocument,
  deleteImage,
  isUploadFolder,
  uploadDocument,
  uploadImage,
} from "@/lib/server/cloudinary";

/* Uploads, proxied to Cloudinary.
 *
 * The browser never sees the API key or secret: it posts the file here and
 * this route does the signed upload. Any signed-in user may replace their
 * own avatar; everything else is for admins, because those files appear on
 * public pages or in the club's document library.
 *
 * The `documents` folder goes up as a Cloudinary "raw" resource so a PDF or
 * a Word file comes back byte for byte; everything else is an image. */

const ADMIN_ROLES = ["admin", "super-admin"];

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  const { session, deny } = requireSession(request);
  if (deny) return deny;

  if (!cloudinaryConfigured) {
    return bad("File hosting is not configured. Set CLOUDINARY_URL.", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Send the file as multipart form data");
  }

  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "avatars");

  if (!(file instanceof File)) return bad("No file was sent");
  if (!isUploadFolder(folderRaw)) {
    return bad(`Unknown folder. Use one of: ${Object.keys(UPLOAD_FOLDERS).join(", ")}`);
  }

  const isAdmin = ADMIN_ROLES.includes(session?.role ?? "");
  if (folderRaw !== "avatars" && !isAdmin) {
    return bad("Only an administrator can upload to that folder", 403);
  }

  const isDocument = folderRaw === "documents";

  if (isDocument) {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    const typeOk = ALLOWED_DOCUMENT_MIME.includes(file.type) || ALLOWED_DOCUMENT_EXT.includes(ext);
    if (!typeOk) {
      return bad(`Unsupported document type. Allowed: ${ALLOWED_DOCUMENT_EXT.join(", ")}`);
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return bad(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB.`,
      );
    }
  } else {
    if (!ALLOWED_MIME.includes(file.type)) {
      return bad(`Unsupported image type. Allowed: ${ALLOWED_MIME.join(", ")}`);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return bad(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      );
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isDocument) {
      const doc = await uploadDocument(buffer, file.name);
      return NextResponse.json({ ok: true, data: { ...doc, originalName: file.name } }, { status: 201 });
    }

    /* Avatars are keyed on the uploader so replacing a picture overwrites
       the old one instead of littering the account. */
    const publicId = folderRaw === "avatars" ? session?.sub : undefined;
    const image = await uploadImage(buffer, folderRaw, { publicId });
    return NextResponse.json({ ok: true, data: { ...image, originalName: file.name } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, deny } = requireSession(request);
  if (deny) return deny;

  if (!cloudinaryConfigured) return bad("File hosting is not configured", 503);

  const publicId = request.nextUrl.searchParams.get("publicId");
  if (!publicId) return bad("publicId is required");

  const isAdmin = ADMIN_ROLES.includes(session?.role ?? "");
  const isOwnAvatar = publicId === `${UPLOAD_FOLDERS.avatars}/${session?.sub}`;
  if (!isAdmin && !isOwnAvatar) return bad("Not yours to delete", 403);

  try {
    if (publicId.startsWith(`${UPLOAD_FOLDERS.documents}/`)) {
      await deleteDocument(publicId);
    } else {
      await deleteImage(publicId);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
