"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, type Language } from "@/lib/i18n";
import { NAV, SettingsShortcut } from "@/components/Nav";

// Sub-pages (e.g. /dashboard/insurance) go back to the tab they live under,
// so the target and its name come from the route rather than each page.
function BackButton() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const segments = pathname.split("/").filter(Boolean);
  const parent = segments.length > 1 ? NAV.find((n) => n.href === `/${segments[0]}`) : undefined;
  if (!parent) return null;
  const label = t(parent.label);
  return (
    <Link
      href={parent.href}
      aria-label={t(TR.nav.backTo) + label}
      className="fp-pop"
      style={{
        display: "inline-flex", alignItems: "center", gap: 1,
        height: 34, padding: "0 14px 0 4px", borderRadius: 999,
        background: "var(--panel)", color: "var(--ink)",
        fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
      }}
    >
      <ChevronLeft size={26} strokeWidth={3.4} aria-hidden />
      {label}
    </Link>
  );
}

// TH/EN switch sized to match the round settings and back buttons beside it
// (34px tall, pill-shaped) rather than the taller general SegmentedControl.
function LanguagePill({ lang, onChange }: { lang: Language; onChange: (lang: Language) => void }) {
  const options: Language[] = ["th", "en"];
  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        position: "relative", display: "flex", width: 76, height: 34, padding: 3,
        background: "var(--panel)", border: "2px solid var(--border)", borderRadius: 999,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", top: 3, bottom: 3, width: "calc(50% - 3px)",
          left: lang === "th" ? 3 : "50%",
          background: "var(--yellow)", border: "1.5px solid var(--border)", borderRadius: 999,
          transition: "left 0.2s ease",
        }}
      />
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={lang === o}
          style={{
            position: "relative", flex: 1, border: "none", background: "transparent", cursor: "pointer", padding: 0,
            fontSize: 12, fontWeight: lang === o ? 700 : 600, color: lang === o ? "var(--ink)" : "var(--ink-soft)",
          }}
        >
          {o.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// Rendered once in the shared tabs layout (not per-page) so it's reachable
// from every tab and lands in DOM/tab order right after the sidebar. Only the
// back button stays on screen while scrolling (see .fp-back-float); the
// language switch and settings scroll away with the page.
export function TopBar() {
  const { lang, setLang } = useLanguage();
  return (
    <>
      <div className="fp-back-float">
        <BackButton />
      </div>
      <div className="fp-topbar">
        <div style={{ flex: 1 }} />
        <LanguagePill lang={lang} onChange={setLang} />
        <SettingsShortcut />
      </div>
    </>
  );
}
