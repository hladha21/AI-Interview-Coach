export default function Card({ children, className = "", padding = "p-6" }) {
  return (
    <div
      className={`rounded-2xl ${padding} ${className}`}
      style={{ background: "#17171c", border: "1px solid #2e2e3a" }}>
      {children}
    </div>
  );
}