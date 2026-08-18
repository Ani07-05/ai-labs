import { NextRequest, NextResponse } from "next/server";
import { getLab } from "@/lib/labs";
import { callGroq } from "@/lib/groq";
import { useHint } from "@/lib/store";

interface ChatBody {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  hint?: boolean;
  name?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const labId = Number(id);
  const lab = getLab(labId);
  if (!lab) {
    return NextResponse.json({ error: "Unknown lab" }, { status: 404 });
  }

  const body: ChatBody = await req.json();

  if (body.hint) {
    const name = body.name || "anonymous";
    const used = await useHint(name, labId);
    const hint = lab.hints[Math.min(used - 1, lab.hints.length - 1)];
    return NextResponse.json({ hint });
  }

  const userMessage = (body.message ?? "").slice(0, 2000);
  const history = (body.history ?? []).slice(-10);

  const messages = [
    { role: "system" as const, content: lab.systemPrompt },
    ...history,
    { role: "user" as const, content: userMessage },
  ];

  let reply = await callGroq(messages);
  let usedFallback = false;
  if (reply === null) {
    usedFallback = true;
    const pool = lab.fallbackReplies;
    reply = pool[Math.floor(Math.random() * pool.length)];
  }

  const secrets = Array.isArray(lab.secret) ? lab.secret : [lab.secret];
  const normalizedReply = normalize(reply);
  const won = secrets.every((s) => normalizedReply.includes(normalize(s)));

  return NextResponse.json({ reply, won, usedFallback });
}

// LLMs often substitute typographic lookalikes (non-breaking hyphen, en/em dash,
// smart quotes) for plain ASCII when repeating a secret. Normalize both sides
// before comparing so a cosmetic substitution doesn't cause a false "not solved".
function normalize(text: string): string {
  return text
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\*\*/g, "");
}
