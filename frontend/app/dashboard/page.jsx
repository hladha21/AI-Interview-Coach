"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUser } from "../../lib/auth";
import api from "../../lib/api";
import Sidebar from "../../components/layout/Sidebar";

function StatsCard({ label, value, color = "#7c6af7" }) {
  return (
    <div style={{
      background: "#1e1e26", border: "1px solid #2e2e3a",
      borderRadius: 12, padding: 20
    }}>
      <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ color, fontSize: 32, fontFamily: "'DM Serif Display', serif" }}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    Promise.all([api.get("/users/stats"), api.get("/sessions")])
      .then(([s, sess]) => { setStats(s.data); setSessions(sess.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avgScore = stats?.averageScores
    ? (Object.values(stats.averageScores).reduce((a, b) => a + b, 0) / 4).toFixed(1)
    : "—";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, overflowY: "auto", background: "#0f0f12" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#e8e8f0" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "#5a5a70", fontSize: 14, marginTop: 4 }}>Track your interview progress</p>
        </div>

        {loading ? (
          <p style={{ color: "#5a5a70" }}>Loading...</p>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <StatsCard label="Total Sessions" value={stats?.totalSessions || 0} />
              <StatsCard label="Completed" value={stats?.completedSessions || 0} color="#4ade80" />
              <StatsCard label="Answers Given" value={stats?.totalAnswers || 0} color="#fbbf24" />
              <StatsCard label="Avg Score" value={avgScore} color="#a395ff" />
            </div>

            {/* Start interview button */}
            <div style={{
              background: "#17171c", border: "1px solid #2e2e3a",
              borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 24
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <h2 style={{ color: "#e8e8f0", fontSize: 18, fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>
                Ready to practice?
              </h2>
              <p style={{ color: "#9898b0", fontSize: 14, marginBottom: 20 }}>
                Start a new AI-powered interview session
              </p>
              <button
                onClick={() => router.push("/interview/new")}
                style={{
                  padding: "12px 28px", borderRadius: 12, background: "#7c6af7",
                  color: "#fff", border: "none", fontSize: 14, fontWeight: 500,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                }}>
                Start New Interview →
              </button>
            </div>

            {/* Recent sessions */}
            <div>
              <h2 style={{ color: "#e8e8f0", fontSize: 15, fontWeight: 500, marginBottom: 16 }}>
                Recent Sessions
              </h2>
              {sessions.length === 0 ? (
                <p style={{ color: "#5a5a70", fontSize: 14 }}>No sessions yet. Start your first interview above!</p>
              ) : (
                sessions.slice(0, 5).map((s) => (
                  <div key={s.id}
                    onClick={() => router.push(`/interview/${s.id}`)}
                    style={{
                      background: "#1e1e26", border: "1px solid #2e2e3a",
                      borderRadius: 12, padding: "16px 20px", marginBottom: 10,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                    <div>
                      <p style={{ color: "#e8e8f0", fontSize: 14, fontWeight: 500 }}>{s.role}</p>
                      <p style={{ color: "#5a5a70", fontSize: 12, marginTop: 2 }}>
                        {s.difficulty} · {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: s.status === "completed" ? "#4ade8015" : "#fbbf2415",
                      color: s.status === "completed" ? "#4ade80" : "#fbbf24",
                      border: `1px solid ${s.status === "completed" ? "#4ade8030" : "#fbbf2430"}`
                    }}>
                      {s.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}