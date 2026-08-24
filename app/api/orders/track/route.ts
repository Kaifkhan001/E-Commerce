import { NextRequest, NextResponse } from "next/server";
import { lookupOrderStatus } from "@/lib/order-tracking/lookup-order";

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email } = await request.json();

    if (!orderNumber || !email || typeof orderNumber !== "string" || typeof email !== "string") {
      return NextResponse.json({ found: false, reason: "not_found" });
    }

    const result = await lookupOrderStatus(orderNumber, email);
    return NextResponse.json(result);
  } catch {
    // Never leak internal error details or Admin API responses to the client.
    return NextResponse.json({ found: false, reason: "not_found" });
  }
}
