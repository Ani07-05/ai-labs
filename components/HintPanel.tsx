"use client";

import { useState } from "react";

export default function HintPanel({ labId, name }: { labId: number; name: string }) {
  const [hints, setHints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function getHint() {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${labId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hint: true, name: name || "anonymous" }),
      });
      const data = await res.json();
      setHints((h) => [...h, data.hint]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="case-card p-4" style={{ background: "var(--folder)" }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          Stuck? A hint costs a few points.
        </span>
        <button
          onClick={getHint}
          disabled={loading}
          className="rounded-sm px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          style={{ background: "var(--stamp-red)", color: "var(--paper)" }}
        >
          {loading ? "..." : "Request hint"}
        </button>
      </div>
      {hints.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--ink)" }}>
          {hints.map((h, i) => (
            <li key={i} className="pl-3" style={{ borderLeft: "3px solid var(--folder-dark)" }}>
              {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
