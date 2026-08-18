import { NextResponse } from "next/server";

// Temporary diagnostic route, no secret values exposed, only presence booleans.
// Remove after confirming the Redis env vars are actually visible at runtime.
export async function GET() {
  return NextResponse.json({
    hasKvUrl: Boolean(process.env.KV_REST_API_URL),
    hasKvToken: Boolean(process.env.KV_REST_API_TOKEN),
    hasUpstashUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    hasUpstashToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
  });
}
