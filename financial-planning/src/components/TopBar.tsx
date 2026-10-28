"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { SegmentedControl } from "@/components/ui";
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

// Rendered once in the shared tabs layout (not per-page) so it's reachable
// from every tab and lands in DOM/tab order right after the sidebar. It
// sticks to the top of the screen so going back or switching language never
// needs a scroll up first.
export function TopBar() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="fp-topbar">
      <BackButton />
      <div style={{ flex: 1 }} />
      <div style={{ width: 108 }}>
        <SegmentedControl
          small
          options={[{ value: "th", label: "TH" }, { value: "en", label: "EN" }]}
          value={lang}
          onChange={setLang}
        />
      </div>
      <SettingsShortcut />
    </div>
  );
}
