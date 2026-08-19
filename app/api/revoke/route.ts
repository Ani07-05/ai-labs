import { NextResponse } from "next/server";
import { LABS, hintCost } from "@/lib/labs";
import { revokeSolves } from "@/lib/store";

// Temporary one-time cleanup route to undo solves/points earned on labs 9-12
// while the Groq key was misconfigured and the site was silently serving
// answer-containing fallback text. Remove after use.
const LABS_TO_REVOKE = [9, 10, 11, 12];

export async function POST() {
  const pointsById: Record<number, number> = {};
  const hintCostById: Record<number, number> = {};
  for (const lab of LABS) {
    pointsById[lab.id] = lab.points;
    hintCostById[lab.id] = hintCost(lab.points);
  }
  const affected = await revokeSolves(LABS_TO_REVOKE, pointsById, hintCostById);
  return NextResponse.json({ revokedLabs: LABS_TO_REVOKE, affected });
}
