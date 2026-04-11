"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "../../lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(form.name, form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
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
            Create your account
          </h1>
          <p style={{ color: "#9898b0", fontSize: 14 }}>Start practicing in seconds</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13,
              background: "#f8717115", color: "#f87171", border: "1px solid #f8717130"
            }}>{error}</div>
          )}
          {["name", "email", "password"].map((field) => (
            <input
              key={field}
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              placeholder={field === "name" ? "Full name" : field === "email" ? "Email" : "Password (min 8 chars)"}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
              style={{
                padding: "12px 16px", borderRadius: 12, fontSize: 14, outline: "none",
                background: "#17171c", border: "1px solid #2e2e3a", color: "#e8e8f0",
                fontFamily: "'DM Sans', sans-serif"
              }}
            />
          ))}
          <button type="submit" disabled={loading} style={{
            padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 500,
            background: "#7c6af7", color: "#fff", border: "none", cursor: "pointer",
            marginTop: 8, opacity: loading ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif"
          }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, marginTop: 20, color: "#9898b0" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#a395ff" }}>Log in</Link>
        </p>
      </div>
    </main>
  );
}