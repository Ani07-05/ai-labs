"use client";

import { useEffect, useState } from "react";
import { LABS } from "@/lib/labs";

interface Row {
  name: string;
  points: number;
  solvedCount: number;
  lastSolveAt?: number;
}

export default function LeaderboardTable() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/score");
      const data = await res.json();
      setRows(data.leaderboard ?? []);
    }
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  if (rows.length === 0) {
    return (
      <div className="case-card p-6 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
        No cases filed yet. Be the first agent on the board.
      </div>
    );
  }

  return (
    <div className="case-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ background: "var(--folder)" }}>
            <th className="px-4 py-3 font-normal" style={{ color: "var(--ink)" }}>
              Rank
            </th>
            <th className="px-4 py-3 font-normal" style={{ color: "var(--ink)" }}>
              Agent
            </th>
            <th className="px-4 py-3 font-normal" style={{ color: "var(--ink)" }}>
              Points
            </th>
            <th className="px-4 py-3 font-normal" style={{ color: "var(--ink)" }}>
              Cases closed
            </th>
            <th className="px-4 py-3 font-normal" style={{ color: "var(--ink)" }}>
              Last solve
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.name}
              style={{ background: i % 2 === 0 ? "var(--card)" : "var(--paper-dark)" }}
            >
              <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                {i + 1}
              </td>
              <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>
                {r.name}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--stamp-red)" }}>
                {r.points}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                {r.solvedCount} of {LABS.length}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                {r.lastSolveAt ? new Date(r.lastSolveAt).toLocaleTimeString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
