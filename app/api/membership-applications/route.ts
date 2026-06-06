import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { CreateApplicationInput, MembershipApplication } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function validateCreateApplication(input: Partial<CreateApplicationInput>): string | null {
  if (!input.fullName?.trim()) return "Full name is required";
  if (!input.email?.trim()) return "Email is required";
  if (!input.phone?.trim()) return "Phone number is required";
  if (!input.lga?.trim()) return "LGA is required";
  if (!input.occupation?.trim()) return "Occupation is required";
  if (!input.reasonForJoining?.trim()) return "Reason for joining is required";
  if (!Array.isArray(input.areasOfInterest)) return "areasOfInterest must be an array";
  if (typeof input.hasVolunteered !== "boolean") return "hasVolunteered must be a boolean";
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("membershipApplications");
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    const filter: Partial<MembershipApplication> = {};
    if (status) filter.status = status as MembershipApplication["status"];
    if (email) filter.email = email;
    if (userId) filter.userId = userId;

    const applications = serializeDocuments(
      await collection.find(filter).sort({ appliedAt: -1 }).toArray()
    );

    return NextResponse.json({ ok: true, data: applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch membership applications";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateApplicationInput>;
    const validationError = validateCreateApplication(payload);

    if (validationError) {
      return badRequest(validationError);
    }

    const collection = await getCollection("membershipApplications");
    const normalizedEmail = payload.email!.trim().toLowerCase();
    const existing = await collection.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An application with this email already exists" },
        { status: 409 }
      );
    }

    const application: MembershipApplication = {
      id: nanoid(),
      fullName: payload.fullName!.trim(),
      email: normalizedEmail,
      phone: payload.phone!.trim(),
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      lga: payload.lga!.trim(),
      ward: payload.ward?.trim(),
      address: payload.address?.trim(),
      occupation: payload.occupation!.trim(),
      employer: payload.employer?.trim(),
      highestEducation: payload.highestEducation,
      reasonForJoining: payload.reasonForJoining!.trim(),
      areasOfInterest: payload.areasOfInterest!,
      hasVolunteered: payload.hasVolunteered!,
      referredBy: payload.referredBy?.trim(),
      documents: payload.documents,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          date: new Date().toISOString(),
          message: "Application received",
        },
      ],
      adminMessages: [],
      appliedAt: new Date().toISOString(),
    };

    await collection.insertOne(application);
    return NextResponse.json({ ok: true, data: application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create membership application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
