import { NextRequest, NextResponse } from "next/server";
import { seedMongoDatabase } from "@/lib/server/seed";

function isAuthorized(request: NextRequest): boolean {
  const configuredToken = process.env.MONGODB_SEED_TOKEN;

  if (!configuredToken) {
    return true;
  }

  return request.headers.get("x-seed-token") === configuredToken;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await seedMongoDatabase();

    return NextResponse.json({
      ok: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database seed failed";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
