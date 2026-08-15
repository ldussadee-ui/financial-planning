"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Target, Layers, type LucideIcon,
} from "lucide-react";

const NAV: { key: string; href: string; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { key: "cashflow", href: "/cashflow", label: "รายรับ-จ่าย", icon: Wallet },
  { key: "assets", href: "/assets", label: "สินทรัพย์", icon: Layers },
  { key: "goals", href: "/goals", label: "เป้าหมาย", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <div
      className="fp-sidebar"
      style={{
        width: 236, background: "#F5EBF7", flexShrink: 0, padding: "24px 16px",
      }}
    >
      <div style={{ padding: "0 8px 24px 8px" }}>
        <div className="fp-display" style={{ fontSize: 21, fontWeight: 700, color: "#7A5C9E" }}>เงินทองของเรา 🌱</div>
        <div style={{ fontSize: 11.5, color: "#9C8FB5", marginTop: 3 }}>เพื่อนช่วยวางแผนการเงิน</div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link
              key={n.key}
              href={n.href}
              className="fp-navbtn"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                cursor: "pointer", textAlign: "left",
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "#7A5C9E" : "#8B7FA0", fontSize: 13.5, fontWeight: active ? 600 : 400,
                boxShadow: "none",
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fp-bottomnav"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "#FFFFFF", borderTop: "1px solid var(--line)",
        display: "flex", justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -1px 3px rgba(74,68,88,0.06)",
      }}
    >
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = pathname === n.href;
        return (
          <Link
            key={n.key}
            href={n.href}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "8px 2px 6px", color: active ? "#7A5C9E" : "#B0A6C2", fontSize: 10,
              fontWeight: active ? 600 : 400,
            }}
          >
            <Icon size={19} strokeWidth={2} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
