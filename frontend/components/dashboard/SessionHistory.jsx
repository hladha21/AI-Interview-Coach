import Link from "next/link";

export default function SessionHistory({ sessions }) {
  if (!sessions.length) {
    return (
      <div className="text-center py-12" style={{ color: "#5a5a70" }}>
        No sessions yet. Start your first interview!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <Link key={s.id} href={`/interview/${s.id}`}
          className="flex items-center justify-between px-5 py-4 rounded-xl transition-all hover:border-opacity-60"
          style={{ background: "#1e1e26", border: "1px solid #2e2e3a" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#e8e8f0" }}>{s.role}</p>
            <p className="text-xs mt-0.5" style={{ color: "#5a5a70" }}>
              {s.difficulty} · {new Date(s.createdAt).toLocaleDateString()} · {s.answers?.length || 0} answers
            </p>
          </div>
          <div className="flex items-center gap-3">
            {s.overallScore && (
              <span className="text-sm font-medium" style={{ color: "#a395ff" }}>
                {s.overallScore.toFixed(1)}/10
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full"
              style={{
                background: s.status === "completed" ? "#4ade8015" : "#fbbf2415",
                color: s.status === "completed" ? "#4ade80" : "#fbbf24",
                border: `1px solid ${s.status === "completed" ? "#4ade8030" : "#fbbf2430"}`,
              }}>
              {s.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}