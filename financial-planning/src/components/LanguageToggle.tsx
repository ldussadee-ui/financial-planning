"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { SegmentedControl } from "@/components/ui";

// Rendered once in the shared tabs layout (not per-page) so it's reachable
// from every tab, not just the Dashboard, and so it lands in DOM/tab order
// right after the sidebar instead of wherever a given page happens to place
// it — it used to live inside Dashboard's own JSX, after the sidebar's nav
// links but visually above them, which put it out of keyboard tab order.
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
      <div style={{ width: 108 }}>
        <SegmentedControl
          small
          options={[{ value: "th", label: "TH" }, { value: "en", label: "EN" }]}
          value={lang}
          onChange={setLang}
        />
      </div>
    </div>
  );
}
