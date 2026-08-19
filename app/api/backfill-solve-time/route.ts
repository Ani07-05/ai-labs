import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Temporary one-time backfill: existing players solved labs before lastSolveAt
// existed, so they'd sort last on any points tie (undefined -> worst). Stamp
// them with the current time so they tie fairly with each other now. Remove
// after use.
const redisUrl =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

interface PlayerData {
  points: number;
  solved: number[];
  hintsUsed: Record<number, number>;
  lastSolveAt?: number;
}

export async function POST() {
  if (!redis) {
    return NextResponse.json({ error: "no redis configured" }, { status: 500 });
  }
  const names = await redis.smembers("agents");
  const now = Date.now();
  const updated: string[] = [];

  for (const name of names) {
    const player = await redis.get<PlayerData>(`player:${name}`);
    if (!player) continue;
    if (player.solved.length > 0 && player.lastSolveAt === undefined) {
      player.lastSolveAt = now;
      await redis.set(`player:${name}`, player);
      updated.push(name);
    }
  }

  return NextResponse.json({ updated });
}
