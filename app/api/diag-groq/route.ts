import { NextResponse } from "next/server";

// TEMPORARY: diagnose why the hosted deploy is always falling back (invalid key,
// rate limit, missing env var, etc). Never returns the key itself. Remove after use.
export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ keyPresent: false });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: "say hi" }],
        temperature: 0.7,
        max_tokens: 400,
        reasoning_effort: "low",
      }),
    });
    const text = await res.text();
    return NextResponse.json({
      keyPresent: true,
      keyLength: apiKey.length,
      status: res.status,
      body: text.slice(0, 2000),
    });
  } catch (err) {
    return NextResponse.json({
      keyPresent: true,
      keyLength: apiKey.length,
      error: String(err),
    });
  }
}
