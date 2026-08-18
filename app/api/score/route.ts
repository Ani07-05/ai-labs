import { NextRequest, NextResponse } from "next/server";
import { getLab, hintCost } from "@/lib/labs";
import { submitSolve, getLeaderboard } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ leaderboard: await getLeaderboard() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim().slice(0, 40);
  const labId = Number(body.labId);
  if (!name || !labId) {
    return NextResponse.json({ error: "name and labId required" }, { status: 400 });
  }
  const lab = getLab(labId);
  if (!lab) {
    return NextResponse.json({ error: "Unknown lab" }, { status: 404 });
  }
  const result = await submitSolve(name, labId, lab.points, hintCost(lab.points));
  return NextResponse.json({ ...result, leaderboard: await getLeaderboard() });
}
