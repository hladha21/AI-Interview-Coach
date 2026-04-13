"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh", background: "#0f0f12",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px", fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: "#7c6af7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, margin: "0 auto 16px"
          }}>🎯</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#e8e8f0", marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ color: "#9898b0", fontSize: 14 }}>Log in to continue practicing</p>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 16,
            background: "#f8717115", color: "#f87171",
            border: "1px solid #f8717140", lineHeight: 1.5,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ color: "#9898b0", fontSize: 12 }}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 14, outline: "none",
                background: "#17171c", border: "1px solid #2e2e3a", color: "#e8e8f0",
                fontFamily: "'DM Sans', sans-serif"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ color: "#9898b0", fontSize: 12 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 14, outline: "none",
                background: "#17171c", border: "1px solid #2e2e3a", color: "#e8e8f0",
                fontFamily: "'DM Sans', sans-serif"
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 500,
            background: loading ? "#5a4fcf" : "#7c6af7", color: "#fff",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s"
          }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, marginTop: 20, color: "#9898b0" }}>
          No account?{" "}
          <Link href="/signup" style={{ color: "#a395ff" }}>Sign up free</Link>
        </p>
      </div>
    </main>
  );
}