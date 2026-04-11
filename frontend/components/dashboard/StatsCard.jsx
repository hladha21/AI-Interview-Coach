export default function StatsCard({ label, value, sub, color = "#7c6af7" }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-1"
      style={{ background: "#1e1e26", border: "1px solid #2e2e3a" }}>
      <span className="text-xs uppercase tracking-widest" style={{ color: "#5a5a70" }}>{label}</span>
      <span className="text-3xl font-medium" style={{ fontFamily: "DM Serif Display, serif", color }}>
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: "#5a5a70" }}>{sub}</span>}
    </div>
  );
}