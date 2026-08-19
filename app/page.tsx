"use client";

import Link from "next/link";
import { LABS } from "@/lib/labs";
import { useName } from "@/lib/useName";

export default function Home() {
  const { name, setName } = useName();
  const core = LABS.filter((l) => l.tier === "core");
  const bonus = LABS.filter((l) => l.tier === "bonus");
  const hard = LABS.filter((l) => l.tier === "hard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="tab">Field Manual, Vol. 1</span>
          <h1 className="mt-2 text-4xl" style={{ color: "var(--ink)" }}>
            AI Security Labs
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Twelve case files. Twelve AI chatbots, each with a secret it was told to keep.
            No coding required. Your job is to talk your way past the guardrail and see
            exactly why it failed. The hard cases have already been patched against the
            obvious tricks, so the classic prompts other people throw at Gemini and GPT
            agents won&apos;t work here.
          </p>
        </div>
        <div className="stamp mt-2 shrink-0">Eyes Only</div>
      </div>

      <div className="case-card mt-8 p-5">
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
          Agent name, for the leaderboard
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name"
            className="min-w-0 flex-1 rounded-sm border-2 px-3 py-2 text-sm"
            style={{ borderColor: "var(--folder-dark)", background: "var(--paper)", color: "var(--ink)" }}
          />
          <Link
            href="/leaderboard"
            className="rounded-sm px-4 py-2 text-sm font-medium"
            style={{ background: "var(--olive)", color: "var(--paper)" }}
          >
            View rankings
          </Link>
        </div>
        {name && (
          <p className="mt-2 text-sm" style={{ color: "var(--olive)" }}>
            Checked in as <strong>{name}</strong>
          </p>
        )}
      </div>

      <Section title="Core case files" note="Work through these in order." labs={core} />
      <Section title="Bonus case files" note="Finished early? These are worth more." labs={bonus} />
      <Section
        title="Hard case files"
        note="These bots have been patched against the tricks used above. Single-shot jailbreak prompts won't cut it."
        labs={hard}
      />
    </div>
  );
}

function Section({
  title,
  note,
  labs,
}: {
  title: string;
  note: string;
  labs: typeof LABS;
}) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl" style={{ color: "var(--ink)" }}>
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        {note}
      </p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        {labs.map((lab, i) => (
          <LabCard
            key={lab.id}
            id={lab.id}
            title={lab.title}
            owasp={lab.owasp}
            points={lab.points}
            scenario={lab.scenario}
            tilt={i % 2 === 0 ? -0.6 : 0.6}
          />
        ))}
      </div>
    </div>
  );
}

function LabCard({
  id,
  title,
  owasp,
  points,
  scenario,
  tilt,
}: {
  id: number;
  title: string;
  owasp: string;
  points: number;
  scenario: string;
  tilt: number;
}) {
  return (
    <Link
      href={`/lab/${id}`}
      className="case-card block p-5 pt-6 transition-transform hover:-translate-y-1 hover:rotate-0"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
          {owasp}
        </span>
        <span className="stamp" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}>
          {points} pts
        </span>
      </div>
      <h3 className="mt-2 text-lg" style={{ color: "var(--ink)" }}>
        Case {id}: {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {scenario}
      </p>
    </Link>
  );
}
