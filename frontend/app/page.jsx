import Link from "next/link";

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0f0f12",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "#7c6af7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 24px"
        }}>🎯</div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 40, color: "#e8e8f0",
          marginBottom: 16, lineHeight: 1.2
        }}>
          Ace your next interview
        </h1>

        <p style={{ color: "#9898b0", fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
          Practice with AI-powered questions, get instant feedback,
          and track your progress over time.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/signup" style={{
            padding: "12px 28px", borderRadius: 12,
            background: "#7c6af7", color: "#fff",
            fontWeight: 500, fontSize: 15,
            textDecoration: "none", display: "inline-block"
          }}>
            Get Started Free
          </Link>
          <Link href="/login" style={{
            padding: "12px 28px", borderRadius: 12,
            border: "1px solid #2e2e3a", color: "#9898b0",
            fontWeight: 500, fontSize: 15,
            textDecoration: "none", display: "inline-block"
          }}>
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}