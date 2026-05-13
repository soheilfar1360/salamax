import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { saveReferral } from "@/lib/referrals/referralStore";
import type { ReferralPayload } from "@/lib/referrals/types";

function isReferralPayload(value: unknown): value is ReferralPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<ReferralPayload>;

  return (
    payload.source === "salamax_family" &&
    typeof payload.symptomsText === "string" &&
    payload.symptomsText.trim().length > 0
  );
}

function createReferralId() {
  return `ref_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isReferralPayload(body)) {
    return NextResponse.json(
      {
        error:
          'Invalid referral payload. source must be "salamax_family" and symptomsText is required.',
      },
      { status: 400 }
    );
  }

  const referralId = createReferralId();
  await saveReferral(referralId, {
    ...body,
    symptomsText: body.symptomsText.trim(),
  });

  return NextResponse.json({
    referralId,
    intakeUrl: `/intake?referralId=${encodeURIComponent(referralId)}`,
  });
}
