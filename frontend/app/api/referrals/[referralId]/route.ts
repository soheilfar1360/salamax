import { NextResponse } from "next/server";
import { getReferral } from "@/lib/referrals/referralStore";

type ReferralRouteContext = {
  params: Promise<{
    referralId: string;
  }>;
};

export async function GET(_request: Request, context: ReferralRouteContext) {
  const { referralId } = await context.params;
  const referral = getReferral(referralId);

  if (!referral) {
    return NextResponse.json(
      {
        error: "Referral not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    referralId: referral.referralId,
    payload: referral.payload,
  });
}
