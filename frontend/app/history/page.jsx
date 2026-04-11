"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "../../lib/auth";
import api from "../../lib/api";
import Sidebar from "../../components/layout/Sidebar";
import SessionHistory from "../../components/dashboard/SessionHistory";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    api.get("/sessions")
      .then((r) => setSessions(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl" style={{ fontFamily: "DM Serif Display, serif", color: "#e8e8f0" }}>
            Session History
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5a5a70" }}>All your past interview sessions</p>
        </div>
        {loading ? (
          <p className="text-sm" style={{ color: "#5a5a70" }}>Loading...</p>
        ) : (
          <SessionHistory sessions={sessions} />
        )}
      </main>
    </div>
  );
}