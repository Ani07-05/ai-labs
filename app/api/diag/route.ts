import { NextResponse } from "next/server";

// Temporary diagnostic route, no secret values exposed, only presence booleans
// plus a raw list of REDIS/UPSTASH/KV-related env var names actually visible
// at runtime, so we can see exactly what name the integration landed under.
// Remove once Redis is confirmed working.
export async function GET() {
  const relevant = Object.keys(process.env).filter((k) =>
    /REDIS|UPSTASH|KV_/i.test(k)
  );
  return NextResponse.json({
    hasKvUrl: Boolean(process.env.KV_REST_API_URL),
    hasKvToken: Boolean(process.env.KV_REST_API_TOKEN),
    hasUpstashUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    hasUpstashToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    hasMangledUrl: Boolean(process.env.UPSTASH_REDIS_REST_KV_REST_API_URL),
    hasMangledToken: Boolean(process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
    relevantEnvNames: relevant,
  });
}
