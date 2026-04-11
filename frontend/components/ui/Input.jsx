export default function Input({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium" style={{ color: "#9898b0" }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2.5 rounded-xl text-sm outline-none w-full transition-all"
        style={{ background: "#17171c", border: "1px solid #2e2e3a", color: "#e8e8f0" }}
        onFocus={(e) => e.target.style.borderColor = "#7c6af7"}
        onBlur={(e) => e.target.style.borderColor = "#2e2e3a"}
      />
    </div>
  );
}