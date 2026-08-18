import Link from "next/link";
import LeaderboardTable from "@/components/LeaderboardTable";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm" style={{ color: "var(--olive)" }}>
        Back to all case files
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span className="tab">Roll Call</span>
      </div>
      <h1 className="mt-2 text-3xl" style={{ color: "var(--ink)" }}>
        Field Agent Rankings
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        Updates on its own every few seconds.
      </p>
      <div className="mt-6">
        <LeaderboardTable />
      </div>
    </div>
  );
}
