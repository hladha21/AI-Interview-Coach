"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout, getUser } from "../../lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/interview/new", label: "New Interview", icon: "◎" },
  { href: "/history", label: "History", icon: "◷" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside style={{
      width: 220, background: "#17171c",
      borderRight: "1px solid #2e2e3a",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "20px 20px 20px",
        borderBottom: "1px solid #2e2e3a"
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "#7c6af7", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 16
        }}>🎯</div>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 16, color: "#e8e8f0"
        }}>PrepAI</span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8,
              color: active ? "#a395ff" : "#9898b0",
              background: active ? "#7c6af720" : "transparent",
              borderLeft: active ? "2px solid #7c6af7" : "2px solid transparent",
              fontSize: 13, textDecoration: "none", transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: 16, borderTop: "1px solid #2e2e3a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c6af7, #c084fc)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ color: "#e8e8f0", fontSize: 13, fontWeight: 500, margin: 0 }}>
              {user?.name}
            </p>
            <p style={{ color: "#5a5a70", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 6,
          color: "#5a5a70", background: "transparent",
          border: "none", fontSize: 12, cursor: "pointer",
          padding: "6px 4px", fontFamily: "'DM Sans', sans-serif"
        }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#5a5a70"}>
          ⎋ Log out
        </button>
      </div>
    </aside>
  );
}