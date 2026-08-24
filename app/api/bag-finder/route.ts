import { NextRequest, NextResponse } from "next/server";
import { recommendBags, type BagFinderAnswers } from "@/features/bag-finder/recommend";

export async function POST(request: NextRequest) {
  try {
    const answers = (await request.json()) as BagFinderAnswers;
    if (!answers.purpose || !answers.capacity) {
      return NextResponse.json({ error: "Missing required answers" }, { status: 400 });
    }
    const products = await recommendBags(answers);
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate recommendations" },
      { status: 500 }
    );
  }
}
