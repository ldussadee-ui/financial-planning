"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Target, Layers, Settings,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";

const NAV = [
  { key: "dashboard", href: "/dashboard", label: TR.nav.dashboard, icon: LayoutDashboard },
  { key: "cashflow", href: "/cashflow", label: TR.nav.cashflow, icon: Wallet },
  { key: "assets", href: "/assets", label: TR.nav.assets, icon: Layers },
  { key: "goals", href: "/goals", label: TR.nav.goals, icon: Target },
  { key: "settings", href: "/settings", label: TR.nav.settings, icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <div
      className="fp-sidebar"
      style={{
        width: 236, background: "#F5EBF7", flexShrink: 0, padding: "24px 16px",
      }}
    >
      <div style={{ padding: "0 8px 24px 8px" }}>
        <div className="fp-display" style={{ fontSize: 21, fontWeight: 700, color: "#7A5C9E" }}>{t(TR.nav.appName)}</div>
        <div style={{ fontSize: 12, color: "#645878", marginTop: 3 }}>{t(TR.nav.appTagline)}</div>
      </div>
      <nav aria-label={t(TR.nav.mainNavAria)} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link
              key={n.key}
              href={n.href}
              className="fp-navbtn"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "13px 12px",
                cursor: "pointer", textAlign: "left",
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "#7A5C9E" : "#645878", fontSize: 14, fontWeight: active ? 600 : 400,
                boxShadow: "none",
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {t(n.label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <nav
      className="fp-bottomnav"
      aria-label={t(TR.nav.quickNavAria)}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        borderTop: "1px solid rgba(74,68,88,0.08)",
        display: "flex", justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom)",
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
              padding: "8px 2px 6px", color: active ? "#7A5C9E" : "#645878", fontSize: 11,
              fontWeight: active ? 600 : 400,
            }}
          >
            <Icon size={19} strokeWidth={2} fill={active ? "#7A5C9E" : "none"} />
            {t(n.label)}
          </Link>
        );
      })}
    </nav>
  );
}
