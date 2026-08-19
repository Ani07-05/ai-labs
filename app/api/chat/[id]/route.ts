import { NextRequest, NextResponse } from "next/server";
import { getLab } from "@/lib/labs";
import { callGroq } from "@/lib/groq";
import { useHint } from "@/lib/store";

interface ChatBody {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  hint?: boolean;
  name?: string;
  stage?: number;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const labId = Number(id);
  const lab = getLab(labId);
  if (!lab) {
    return NextResponse.json({ error: "Unknown lab" }, { status: 404 });
  }

  const body: ChatBody = await req.json();

  // For multi-stage labs, everything (system prompt, secret, hints) comes from the
  // stage currently in progress, not the lab-level placeholders.
  const stageIdx = lab.stages ? Math.min(Math.max(body.stage ?? 0, 0), lab.stages.length - 1) : 0;
  const stage = lab.stages?.[stageIdx];
  const isFinalStage = !lab.stages || stageIdx === lab.stages.length - 1;

  if (body.hint) {
    const name = body.name || "anonymous";
    // Composite key so hint usage/cost is tracked per stage, not shared across the whole lab.
    const hintKey = lab.stages ? labId * 100 + stageIdx : labId;
    const hintsPool = stage ? stage.hints : lab.hints;
    const used = await useHint(name, hintKey);
    const hint = hintsPool[Math.min(used - 1, hintsPool.length - 1)];
    return NextResponse.json({ hint });
  }

  const userMessage = (body.message ?? "").slice(0, 2000);
  const history = (body.history ?? []).slice(-10);

  const systemPrompt = stage ? stage.systemPrompt : lab.systemPrompt;
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history,
    { role: "user" as const, content: userMessage },
  ];

  const reply = await callGroq(messages);
  const usedFallback = reply === null;

  // Never award a win off a fallback reply: those are static/random text, not the
  // bot actually being talked into it, and some are written to sound like a partial
  // confession for flavor, which would otherwise let anyone "solve" a lab just by
  // catching Groq down.
  let stageWon = false;
  if (!usedFallback) {
    const secretSource = stage ? stage.secret : lab.secret;
    const secrets = Array.isArray(secretSource) ? secretSource : [secretSource];
    const normalizedReply = normalize(reply);
    stageWon = secrets.every((s) => normalizedReply.includes(normalize(s)));
  }
  const won = stageWon && isFinalStage;

  return NextResponse.json({
    reply: usedFallback
      ? "(the line's noisy right now, the bot didn't catch that, try sending it again in a moment)"
      : reply,
    won,
    usedFallback,
    stageWon,
    stageIndex: stageIdx,
    isFinalStage,
    stageCount: lab.stages?.length,
  });
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
