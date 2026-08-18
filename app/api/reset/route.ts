import { NextResponse } from "next/server";
import { resetLeaderboard } from "@/lib/store";

// Temporary one-time cleanup route to clear test entries from the
// leaderboard before the real session. Remove after use.
export async function POST() {
  const cleared = await resetLeaderboard();
  return NextResponse.json({ cleared });
}
