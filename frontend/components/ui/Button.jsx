export default function Button({ children, onClick, variant = "primary", disabled, className = "", type = "button" }) {
  const styles = {
    primary: { background: "#7c6af7", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#9898b0", border: "1px solid #3a3a4a" },
    danger: { background: "#f8717115", color: "#f87171", border: "1px solid #f8717130" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}>
      {children}
    </button>
  );
}