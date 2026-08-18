import { getLab, toPublicLab } from "@/lib/labs";
import ChatWindow from "@/components/ChatWindow";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = getLab(Number(id));
  if (!lab) notFound();

  const publicLab = toPublicLab(lab);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm" style={{ color: "var(--olive)" }}>
        Back to all case files
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="tab">{publicLab.tier === "core" ? "Core case" : "Bonus case"}</span>
        <span className="tab" style={{ background: "var(--ink-soft)", color: "var(--paper)" }}>
          {publicLab.owasp}
        </span>
        <span className="stamp" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}>
          {publicLab.points} pts
        </span>
      </div>

      <h1 className="mt-3 text-3xl" style={{ color: "var(--ink)" }}>
        Case {publicLab.id}: {publicLab.title}
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {publicLab.scenario}
      </p>

      <div className="mt-7">
        <ChatWindow lab={publicLab} />
      </div>
    </div>
  );
}
