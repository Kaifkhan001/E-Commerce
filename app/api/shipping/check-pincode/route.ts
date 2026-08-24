import { NextRequest, NextResponse } from "next/server";
import { checkPincodeServiceability } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  try {
    const { pincode, weightKg, cod } = await request.json();

    if (!pincode || !/^\d{6}$/.test(String(pincode))) {
      return NextResponse.json({ error: "Enter a valid 6-digit pincode" }, { status: 400 });
    }

    const result = await checkPincodeServiceability(String(pincode), weightKg ?? 0.5, Boolean(cod));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { configured: false, error: err instanceof Error ? err.message : "Serviceability check failed" },
      { status: 500 }
    );
  }
}
