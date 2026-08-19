"use client";

import { useState } from "react";
import type { PublicLab } from "@/lib/labs";
import { useName } from "@/lib/useName";
import HintPanel from "./HintPanel";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWindow({ lab }: { lab: PublicLab }) {
  const { name } = useName();
  const stages = lab.stages;
  const [stage, setStage] = useState(0);
  const currentStage = stages?.[stage];
  const initialInput = currentStage?.seedUserMessage ?? lab.seedUserMessage ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [won, setWon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput(currentStage?.seedUserMessage ?? lab.seedUserMessage ?? "");
    setLoading(true);

    try {
      const res = await fetch(`/api/chat/${lab.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: nextMessages, name, stage }),
      });
      const data = await res.json();
      const replyMsg: Message = { role: "assistant", content: data.reply };

      if (data.stageWon && stages && !data.isFinalStage) {
        const nextIdx = stage + 1;
        const nextStage = stages[nextIdx];
        setMessages([
          ...nextMessages,
          replyMsg,
          {
            role: "assistant",
            content: `— Stage ${stage + 1} cleared. Moving to "${nextStage.title}". —`,
          },
        ]);
        setStage(nextIdx);
        setInput(nextStage.seedUserMessage ?? "");
      } else {
        setMessages([...nextMessages, replyMsg]);
      }
      if (data.won) setWon(true);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "(the line went dead, try sending that again)" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitScore() {
    if (!name) return;
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, labId: lab.id }),
    });
    const data = await res.json();
    setPointsAwarded(data.awarded ?? 0);
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {currentStage && (
        <div className="case-card p-4" style={{ borderLeft: "4px solid var(--olive)" }}>
          <span className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            {currentStage.title} · Stage {stage + 1} of {stages!.length}
          </span>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
            {currentStage.scenario}
          </p>
        </div>
      )}

      <div
        className="case-card flex h-[420px] flex-col gap-3 overflow-y-auto p-4"
        style={{ background: "var(--paper-dark)" }}
      >
        {messages.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No transcript yet. Say something to the bot below.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[80%] rounded-sm px-3 py-2 text-sm"
            style={
              m.role === "user"
                ? { alignSelf: "flex-end", background: "var(--olive)", color: "var(--paper)" }
                : { alignSelf: "flex-start", background: "var(--card)", color: "var(--ink)" }
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start text-sm" style={{ color: "var(--ink-soft)" }}>
            transcribing reply...
          </div>
        )}
      </div>

      {won && !submitted && (
        <div className="case-card p-5" style={{ borderLeft: "4px solid var(--stamp-red)" }}>
          <div className="stamp stamp-animate">Case Closed</div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {lab.whyItMatters}
          </p>
          <button
            onClick={submitScore}
            disabled={!name}
            className="mt-4 rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--stamp-red)", color: "var(--paper)" }}
          >
            {name ? "File this case to the leaderboard" : "Enter your name on the home page first"}
          </button>
        </div>
      )}

      {submitted && (
        <div className="case-card p-4 text-sm" style={{ color: "var(--olive)" }}>
          Filed. You earned {pointsAwarded} points.{" "}
          <a href="/leaderboard" className="underline">
            Check the rankings.
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your message"
          className="min-w-0 flex-1 rounded-sm border-2 px-3 py-2 text-sm"
          style={{ borderColor: "var(--folder-dark)", background: "var(--paper)", color: "var(--ink)" }}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-sm px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          Send
        </button>
      </div>

      <HintPanel key={stage} labId={lab.id} name={name} stage={stage} />
    </div>
  );
}
