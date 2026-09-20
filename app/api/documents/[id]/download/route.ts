import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { getRequestSession } from "@/lib/server/guards";

/* Downloads, proxied.
 *
 * Documents are never linked to Cloudinary directly. The browser asks this
 * route, the route checks the session against the record's `access` field,
 * and only then fetches the bytes server side and streams them back. Linking
 * straight to Cloudinary would make `access` decorative, because anyone
 * holding the URL could read a members-only document.
 *
 * It also means the hosting can change without touching the pages, and the
 * file arrives with its real club filename rather than a slugified public id.
 */

const ADMIN_ROLES = ["admin", "super-admin"];

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;

    const collection = await getCollection("documents");
    const document = serializeDocument(await collection.findOne({ id }));
    if (!document) return fail("Document not found", 404);
    if (!document.url) return fail("No file is attached to this document", 404);

    const session = getRequestSession(request);
    const isAdmin = ADMIN_ROLES.includes(session?.role ?? "");

    if (document.access === "admin-only" && !isAdmin) {
      return fail("That document is for administrators only", 403);
    }
    if (document.access === "members-only" && !session) {
      return fail("Sign in to download this document", 401);
    }

    const upstream = await fetch(document.url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      /* Cloudinary refuses to deliver PDFs until "PDF and ZIP files
         delivery" is enabled under Settings > Security. Say so plainly
         rather than passing a bare 401 to the member. */
      const hint =
        upstream.status === 401
          ? "the file host is refusing to deliver it. In Cloudinary, under Settings > Security, allow PDF and ZIP files delivery."
          : `the file host answered ${upstream.status}.`;
      return fail(`Could not fetch that file: ${hint}`, 502);
    }

    const ext = (document.name.split(".").pop() ?? "").toLowerCase();
    const headers = new Headers({
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      /* The name is quoted and stripped of quotes and newlines so it cannot
         break out of the header. */
      "Content-Disposition": `attachment; filename="${document.name.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, no-store",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return fail(message, 500);
  }
}
