import { NextResponse } from "next/server";
import { getCollection } from "@/lib/server/collections";
import { parseSocialProfiles, type SocialProfiles } from "@/lib/social-profiles";

export const dynamic = "force-dynamic";

/** Public officers' links only. Never return their private user records. */
export async function GET() {
  try {
    const users = await getCollection("users");
    const officers = await users.find({
      office: { $in: ["exco", "trustees", "patron"] },
      role: { $in: ["member", "admin", "super-admin"] },
      status: "active",
    }).project({ _id: 0, id: 1, linkedinUrl: 1, instagramUrl: 1, facebookUrl: 1 }).toArray();
    const data: Record<string, SocialProfiles> = {};
    for (const officer of officers) {
      const social = parseSocialProfiles(officer);
      if (social.ok) data[officer.id] = social.values;
    }
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load social profiles." }, { status: 503 });
  }
}
