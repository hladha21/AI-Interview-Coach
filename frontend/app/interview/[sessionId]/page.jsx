"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isLoggedIn } from "../../../lib/auth";
import api from "../../../lib/api";
import axios from "axios";

function ScoreBar({ label, value }) {
  const color = value >= 8 ? "#4ade80" : value >= 6 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9898b0", fontSize: 13 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{value}/10</span>
      </div>
      <div style={{ height: 6, background: "#252530", borderRadius: 3 }}>
        <div style={{
          height: "100%", borderRadius: 3, background: color,
          width: `${value * 10}%`, transition: "width 0.8s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
    </div>
  );
}

function SetupScreen({ onCreate }) {
  const [role, setRole] = useState("Frontend Engineer");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [loading, setLoading] = useState(false);
  const roles = ["Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
    "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager"];

  async function start() {
    setLoading(true);
    try {
      const session = await api.post("/sessions", { role, difficulty });
      const questions = await axios.post(
        `${process.env.NEXT_PUBLIC_AI_API}/questions`,
        { role, difficulty, count: 8 }
      );
      onCreate(session.data, questions.data.questions);
    } catch {
      alert("Failed to start. Make sure all backends are running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f12",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: 24
    }}>
      <div style={{ width: "100%", maxWidth: 500 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "#7c6af7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, margin: "0 auto 16px"
          }}>🎯</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#e8e8f0", marginBottom: 8 }}>
            Start Interview
          </h1>
          <p style={{ color: "#5a5a70", fontSize: 14 }}>Choose your role and difficulty level</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ color: "#9898b0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
              Role
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12, fontSize: 14,
              background: "#17171c", border: "1px solid #2e2e3a", color: "#e8e8f0",
              outline: "none", fontFamily: "'DM Sans', sans-serif"
            }}>
              {roles.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: "#9898b0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
              Difficulty
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              {["easy", "intermediate", "hard"].map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  flex: 1, padding: "12px", borderRadius: 10, fontSize: 13,
                  textTransform: "capitalize", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  background: difficulty === d ? "#7c6af720" : "#1e1e26",
                  border: `1px solid ${difficulty === d ? "#7c6af7" : "#2e2e3a"}`,
                  color: difficulty === d ? "#a395ff" : "#9898b0",
                  fontWeight: difficulty === d ? 600 : 400,
                  transition: "all 0.15s"
                }}>{d}</button>
              ))}
            </div>
          </div>

          <button onClick={start} disabled={loading} style={{
            padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 600,
            background: "#7c6af7", color: "#fff", border: "none",
            cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
            fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
            transition: "all 0.15s"
          }}>
            {loading ? "Generating questions..." : "Start Interview →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const isNew = sessionId === "new";

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    if (!isNew) {
      api.get(`/sessions/${sessionId}`).then((r) => {
        setSession(r.data);
        setDone(r.data.status === "completed");
      });
    }
  }, []);

  async function submitAnswer() {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.post(`/sessions/${session.id}/answer`, {
        questionText: questions[current],
        answerText: answer,
      });
      setFeedback(res.data.feedback);
    } catch {
      alert("Failed to get feedback.");
    } finally {
      setLoading(false);
    }
  }

  async function nextQuestion() {
    if (current + 1 >= questions.length) {
      await api.patch(`/sessions/${session.id}/complete`);
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setAnswer("");
      setFeedback(null);
    }
  }

  if (!isLoggedIn()) return null;

  if (isNew && !session) {
    return <SetupScreen onCreate={(s, q) => { setSession(s); setQuestions(q); }} />;
  }

  if (done) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0f12",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "#e8e8f0", marginBottom: 12 }}>
            Interview Complete!
          </h1>
          <p style={{ color: "#9898b0", fontSize: 15, marginBottom: 32 }}>
            Great work. Check your dashboard for full results.
          </p>
          <button onClick={() => router.push("/dashboard")} style={{
            padding: "14px 32px", borderRadius: 12, background: "#7c6af7",
            color: "#fff", border: "none", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
          }}>
            View Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const overallScore = feedback
    ? ((feedback.scores.clarity + feedback.scores.depth + feedback.scores.relevance + feedback.scores.confidence) / 4).toFixed(1)
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f12", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Collapsible Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 40, backdropFilter: "blur(2px)"
          }}
        />
      )}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: "#17171c", borderRight: "1px solid #2e2e3a",
        zIndex: 50, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #2e2e3a", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7c6af7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#e8e8f0" }}>PrepAI</span>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { href: "/dashboard", label: "Dashboard", icon: "⊞" },
            { href: "/interview/new", label: "New Interview", icon: "◎" },
            { href: "/history", label: "History", icon: "◷" },
          ].map(({ href, label, icon }) => (
            <button key={href} onClick={() => { router.push(href); setSidebarOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, fontSize: 13,
              color: "#9898b0", background: "transparent",
              border: "none", cursor: "pointer", textAlign: "left",
              fontFamily: "'DM Sans', sans-serif", width: "100%"
            }}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
      </div>

      {/* Top Bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "#17171c", borderBottom: "1px solid #2e2e3a",
        padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: "#1e1e26", border: "1px solid #2e2e3a",
            borderRadius: 8, padding: "6px 10px", cursor: "pointer",
            color: "#9898b0", fontSize: 16, display: "flex", alignItems: "center", gap: 6
          }}>
            ☰ <span style={{ fontSize: 12 }}>Menu</span>
          </button>
          <div>
            <p style={{ color: "#e8e8f0", fontSize: 15, fontWeight: 600, margin: 0 }}>{session?.role}</p>
            <p style={{ color: "#5a5a70", fontSize: 12, margin: 0 }}>{session?.difficulty} · Question {current + 1} of {questions.length}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: i === current ? 20 : 8, height: 8, borderRadius: 4,
              background: i < current ? "#4ade80" : i === current ? "#7c6af7" : "#2e2e3a",
              transition: "all 0.3s"
            }} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>

        {/* Question Card */}
        <div style={{
          background: "#17171c", border: "1px solid #2e2e3a",
          borderRadius: 16, padding: "24px 28px", marginBottom: 20
        }}>
          <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Question {current + 1}
          </p>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#e8e8f0", lineHeight: 1.5, margin: 0 }}>
            {questions[current]}
          </p>
        </div>

        {/* Answer Card */}
        <div style={{
          background: "#17171c", border: "1px solid #2e2e3a",
          borderRadius: 16, padding: "24px 28px", marginBottom: 20
        }}>
          <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Your Answer
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here in detail..."
            rows={6}
            style={{
              width: "100%", padding: 16, borderRadius: 10, fontSize: 15,
              background: "#1e1e26", border: "1px solid #2e2e3a",
              color: "#e8e8f0", outline: "none", resize: "vertical",
              lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box"
            }}
          />
          <button
            onClick={submitAnswer}
            disabled={loading || !answer.trim()}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, fontSize: 15,
              fontWeight: 600, background: "#7c6af7", color: "#fff",
              border: "none", cursor: loading || !answer.trim() ? "not-allowed" : "pointer",
              marginTop: 12, fontFamily: "'DM Sans', sans-serif",
              opacity: loading || !answer.trim() ? 0.4 : 1, transition: "all 0.15s"
            }}>
            {loading ? "Analyzing your answer..." : "Get AI Feedback →"}
          </button>
        </div>

        {/* Feedback Card — Full Width */}
        {(feedback || loading) && (
          <div style={{
            background: "#17171c", border: `1px solid ${feedback ? "#7c6af740" : "#2e2e3a"}`,
            borderRadius: 16, padding: "28px", marginBottom: 20,
            animation: "fadeIn 0.4s ease"
          }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32 }}>🤔</div>
                <p style={{ color: "#9898b0", fontSize: 14 }}>Analyzing your answer...</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: "50%", background: "#7c6af7",
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
                <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
              </div>
            )}

            {feedback && (
              <>
                {/* Score Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>AI Feedback</p>
                    <p style={{ color: "#e8e8f0", fontSize: 15, fontWeight: 600, margin: 0 }}>Here's how you did</p>
                  </div>
                  <div style={{ textAlign: "center", background: "#1e1e26", borderRadius: 12, padding: "12px 24px" }}>
                    <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#a395ff", margin: 0, lineHeight: 1 }}>
                      {overallScore}
                    </p>
                    <p style={{ color: "#5a5a70", fontSize: 11, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.07em" }}>Overall</p>
                  </div>
                </div>

                {/* Score Bars — 2 column grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", marginBottom: 24 }}>
                  <ScoreBar label="Clarity" value={feedback.scores.clarity} />
                  <ScoreBar label="Depth" value={feedback.scores.depth} />
                  <ScoreBar label="Relevance" value={feedback.scores.relevance} />
                  <ScoreBar label="Confidence" value={feedback.scores.confidence} />
                </div>

                {/* Summary */}
                <div style={{
                  background: "#1e1e26", borderRadius: 12, padding: "16px 20px", marginBottom: 20,
                  borderLeft: "3px solid #7c6af7"
                }}>
                  <p style={{ color: "#9898b0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    {feedback.summary}
                  </p>
                </div>

                {/* Strengths and Improvements side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div style={{ background: "#4ade8010", borderRadius: 12, padding: "16px 20px", border: "1px solid #4ade8030" }}>
                    <p style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                      ✓ Strengths
                    </p>
                    {feedback.strengths.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#9898b0", marginBottom: 8, lineHeight: 1.5 }}>
                        <span style={{ color: "#4ade80", flexShrink: 0 }}>•</span> {s}
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#fbbf2410", borderRadius: 12, padding: "16px 20px", border: "1px solid #fbbf2430" }}>
                    <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                      ! Improve
                    </p>
                    {feedback.improvements.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#9898b0", marginBottom: 8, lineHeight: 1.5 }}>
                        <span style={{ color: "#fbbf24", flexShrink: 0 }}>•</span> {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <button onClick={nextQuestion} style={{
                  width: "100%", padding: "14px", borderRadius: 12, fontSize: 15,
                  fontWeight: 600, background: "#7c6af7", color: "#fff",
                  border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s"
                }}>
                  {current + 1 >= questions.length ? "🎉 Finish Interview" : "Next Question →"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}