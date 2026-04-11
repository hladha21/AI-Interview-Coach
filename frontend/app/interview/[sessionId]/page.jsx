"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isLoggedIn } from "../../../lib/auth";
import api from "../../../lib/api";
import axios from "axios";
import Sidebar from "../../../components/layout/Sidebar";

const S = {
  label: { color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "block" },
  card: { background: "#17171c", border: "1px solid #2e2e3a", borderRadius: 16, padding: 24 },
  btn: (bg = "#7c6af7", color = "#fff") => ({
    padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500,
    background: bg, color, border: bg === "transparent" ? "1px solid #3a3a4a" : "none",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
  }),
};

function ScoreBar({ label, value }) {
  const color = value >= 8 ? "#4ade80" : value >= 6 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#9898b0", fontSize: 12 }}>{label}</span>
        <span style={{ color, fontSize: 12 }}>{value}/10</span>
      </div>
      <div style={{ height: 5, background: "#252530", borderRadius: 3 }}>
        <div style={{ height: "100%", borderRadius: 3, background: color, width: `${value * 10}%`, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

function SetupScreen({ onCreate }) {
  const [role, setRole] = useState("Frontend Engineer");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [loading, setLoading] = useState(false);
  const roles = ["Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "Data Scientist", "ML Engineer", "DevOps Engineer", "Product Manager"];

  async function start() {
    setLoading(true);
    try {
      const session = await api.post("/sessions", { role, difficulty });
      const questions = await axios.post(`${process.env.NEXT_PUBLIC_AI_API}/questions`, { role, difficulty, count: 8 });
      onCreate(session.data, questions.data.questions);
    } catch {
      alert("Failed to start. Make sure all 3 backends are running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#e8e8f0", marginBottom: 8 }}>Start Interview</h1>
      <p style={{ color: "#5a5a70", fontSize: 14, marginBottom: 32 }}>Choose your role and difficulty</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={S.label}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{
            width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14,
            background: "#17171c", border: "1px solid #2e2e3a", color: "#e8e8f0",
            outline: "none", fontFamily: "'DM Sans', sans-serif"
          }}>
            {roles.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={S.label}>Difficulty</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["easy", "intermediate", "hard"].map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} style={{
                flex: 1, padding: "10px", borderRadius: 10, fontSize: 13,
                textTransform: "capitalize", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                background: difficulty === d ? "#7c6af720" : "#1e1e26",
                border: `1px solid ${difficulty === d ? "#7c6af7" : "#2e2e3a"}`,
                color: difficulty === d ? "#a395ff" : "#9898b0",
              }}>{d}</button>
            ))}
          </div>
        </div>

        <button onClick={start} disabled={loading} style={{
          ...S.btn(), marginTop: 8, padding: "13px",
          opacity: loading ? 0.6 : 1, fontSize: 14
        }}>
          {loading ? "Generating questions..." : "Start Interview →"}
        </button>
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
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 32, background: "#0f0f12" }}>
          <SetupScreen onCreate={(s, q) => { setSession(s); setQuestions(q); }} />
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f12" }}>
          <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#e8e8f0", marginBottom: 8 }}>
              Interview Complete!
            </h1>
            <p style={{ color: "#9898b0", fontSize: 14, marginBottom: 28 }}>
              Great work. Check your dashboard for results.
            </p>
            <button onClick={() => router.push("/dashboard")} style={S.btn()}>
              View Dashboard →
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 28, background: "#0f0f12", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#e8e8f0" }}>
              {session?.role}
            </h1>
            <p style={{ color: "#5a5a70", fontSize: 12, marginTop: 2 }}>
              {session?.difficulty} · Question {current + 1} of {questions.length}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i < current ? "#4ade80" : i === current ? "#7c6af7" : "#2e2e3a"
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

          {/* Left: Question + Answer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={S.card}>
              <span style={S.label}>Question</span>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#e8e8f0", lineHeight: 1.5 }}>
                {questions[current]}
              </p>
            </div>

            <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={S.label}>Your Answer</span>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                style={{
                  width: "100%", padding: 14, borderRadius: 10, fontSize: 14,
                  background: "#1e1e26", border: "1px solid #2e2e3a",
                  color: "#e8e8f0", outline: "none", resize: "none",
                  lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif"
                }}
              />
              <button
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
                style={{
                  ...S.btn(), width: "100%", padding: "13px",
                  opacity: loading || !answer.trim() ? 0.4 : 1, fontSize: 14
                }}>
                {loading ? "Analyzing..." : "Get AI Feedback →"}
              </button>
            </div>
          </div>

          {/* Right: Feedback */}
          <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 16, alignSelf: "start" }}>
            <span style={{ color: "#e8e8f0", fontSize: 14, fontWeight: 500 }}>AI Feedback</span>

            {!feedback && !loading && (
              <p style={{ color: "#5a5a70", fontSize: 13 }}>Submit your answer to get instant AI feedback.</p>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[80, 60, 70].map((w, i) => (
                  <div key={i} style={{ height: 10, borderRadius: 4, background: "#252530", width: `${w}%` }} />
                ))}
              </div>
            )}

            {feedback && (
              <>
                <div style={{ textAlign: "center", padding: 16, background: "#1e1e26", borderRadius: 10 }}>
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#a395ff" }}>
                    {((feedback.scores.clarity + feedback.scores.depth + feedback.scores.relevance + feedback.scores.confidence) / 4).toFixed(1)}
                  </p>
                  <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" }}>Overall</p>
                </div>

                <ScoreBar label="Clarity" value={feedback.scores.clarity} />
                <ScoreBar label="Depth" value={feedback.scores.depth} />
                <ScoreBar label="Relevance" value={feedback.scores.relevance} />
                <ScoreBar label="Confidence" value={feedback.scores.confidence} />

                <p style={{ color: "#9898b0", fontSize: 13, lineHeight: 1.6 }}>{feedback.summary}</p>

                <div>
                  <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Strengths</p>
                  {feedback.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#9898b0", marginBottom: 6 }}>
                      <span style={{ color: "#4ade80" }}>✓</span> {s}
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ color: "#5a5a70", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Improve</p>
                  {feedback.improvements.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#9898b0", marginBottom: 6 }}>
                      <span style={{ color: "#fbbf24" }}>!</span> {s}
                    </div>
                  ))}
                </div>

                <button onClick={nextQuestion} style={{ ...S.btn(), width: "100%", padding: 12 }}>
                  {current + 1 >= questions.length ? "Finish Interview ✓" : "Next Question →"}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}