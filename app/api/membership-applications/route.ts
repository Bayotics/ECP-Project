import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { CreateApplicationInput, MembershipApplication } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { getRequestSession, unauthorized } from "@/lib/server/guards";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

/* Addresses are US first with an international fallback, per §7 of the
   website review: no LGA, no ward. `lga` and `ward` survive on the model
   only so applications taken before the change still read back. */
function validateAddress(input: Partial<CreateApplicationInput>): string | null {
  const country = input.country?.trim();
  if (!country) return "Country is required";
  if (!input.city?.trim()) return "City is required";
  if (country === "US") {
    if (!input.stateProvince?.trim()) return "State is required";
    const zip = input.zipPostal?.trim();
    if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) return "Enter a valid ZIP code";
  }
  return null;
}

function validateCreateApplication(input: Partial<CreateApplicationInput>): string | null {
  if (!input.fullName?.trim()) return "Full name is required";
  if (!input.email?.trim()) return "Email is required";
  if (!input.phone?.trim()) return "Phone number is required";
  const addressError = validateAddress(input);
  if (addressError) return addressError;
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

    // Unauthenticated access is allowed ONLY for the public "check my
    // application status" flow, which must supply an exact email filter.
    // Everything else (full list, status/userId queries) requires a session.
    const session = getRequestSession(request);
    if (!session && !email?.trim()) {
      return unauthorized();
    }

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
      country: payload.country!.trim(),
      streetAddress: payload.streetAddress?.trim(),
      aptUnit: payload.aptUnit?.trim(),
      city: payload.city!.trim(),
      stateProvince: payload.stateProvince?.trim(),
      zipPostal: payload.zipPostal?.trim(),
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
