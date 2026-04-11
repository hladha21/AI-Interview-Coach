"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "../../lib/auth";
import api from "../../lib/api";
import Sidebar from "../../components/layout/Sidebar";
import StatsCard from "../../components/dashboard/StatsCard";
import SessionHistory from "../../components/dashboard/SessionHistory";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    Promise.all([api.get("/users/stats"), api.get("/sessions")])
      .then(([s, sess]) => { setStats(s.data); setSessions(sess.data); })
      .finally(() => setLoading(false));
  }, []);

  const radarData = stats ? [
    { skill: "Clarity", score: stats.averageScores.clarity },
    { skill: "Depth", score: stats.averageScores.depth },
    { skill: "Relevance", score: stats.averageScores.relevance },
    { skill: "Confidence", score: stats.averageScores.confidence },
  ] : [];

  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl" style={{ fontFamily: "DM Serif Display, serif", color: "#e8e8f0" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5a5a70" }}>Track your interview progress</p>
        </div>

        {loading ? (
          <div className="text-sm" style={{ color: "#5a5a70" }}>Loading...</div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <StatsCard label="Total Sessions" value={stats?.totalSessions || 0} />
              <StatsCard label="Completed" value={stats?.completedSessions || 0} color="#4ade80" />
              <StatsCard label="Answers Given" value={stats?.totalAnswers || 0} color="#fbbf24" />
              <StatsCard
                label="Avg Score"
                value={stats?.averageScores ? (
                  Object.values(stats.averageScores).reduce((a, b) => a + b, 0) / 4
                ).toFixed(1) : "—"}
                color="#a395ff"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Radar */}
              <div className="rounded-2xl p-6" style={{ background: "#17171c", border: "1px solid #2e2e3a" }}>
                <h2 className="text-sm font-medium mb-4" style={{ color: "#e8e8f0" }}>Skill Breakdown</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2e2e3a" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "#9898b0", fontSize: 11 }} />
                    <Radar dataKey="score" stroke="#7c6af7" fill="#7c6af7" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score trend */}
              <div className="rounded-2xl p-6" style={{ background: "#17171c", border: "1px solid #2e2e3a" }}>
                <h2 className="text-sm font-medium mb-4" style={{ color: "#e8e8f0" }}>Score Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats?.scoreTrend || []}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 10]} tick={{ fill: "#9898b0", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#1e1e26", border: "1px solid #2e2e3a", borderRadius: 8 }}
                      labelStyle={{ color: "#9898b0" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#7c6af7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent sessions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium" style={{ color: "#e8e8f0" }}>Recent Sessions</h2>
                <button onClick={() => router.push("/interview/new")}
                  className="text-xs px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5"
                  style={{ background: "#7c6af7", color: "#fff" }}>
                  + New Interview
                </button>
              </div>
              <SessionHistory sessions={sessions.slice(0, 5)} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}