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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(lab.seedUserMessage ?? "");
  const [loading, setLoading] = useState(false);
  const [won, setWon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput(lab.seedUserMessage ?? "");
    setLoading(true);

    try {
      const res = await fetch(`/api/chat/${lab.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: nextMessages, name }),
      });
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
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

      <HintPanel labId={lab.id} name={name} />
    </div>
  );
}
