"use client";

import type { CSSProperties } from "react";
import { fmtRange, type CycleRange } from "@/lib/calc";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";

const navButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, width: 26, height: 26, fontSize: 13, cursor: "pointer", lineHeight: "1",
};
const backToCurrentStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink-soft)",
  borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
};

// The ‹ cycle › stepper. Lives here rather than in the cashflow tab so every
// screen that moves through cycles uses one control that looks and behaves
// the same — the payment summary is reached from the cashflow tab, and a
// second, slightly different stepper there would be the first thing to drift.
export function CycleNav({
  offset, range, onChange,
}: {
  offset: number;
  range: CycleRange;
  onChange: (offset: number) => void;
}) {
  const { lang, t } = useLanguage();
  const isCurrent = offset === 0;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <button type="button" onClick={() => onChange(offset - 1)} style={navButtonStyle} aria-label={t(TR.cashflow.prevCycle)}>‹</button>
      🗓️ {isCurrent ? t(TR.cashflow.currentCycle) : t(TR.cashflow.cycle)}: <b style={{ color: "var(--ink)" }}>{fmtRange(range, lang)}</b>
      <button type="button" onClick={() => onChange(offset + 1)} style={navButtonStyle} aria-label={t(TR.cashflow.nextCycle)}>›</button>
      {!isCurrent && (
        <button type="button" onClick={() => onChange(0)} style={backToCurrentStyle}>
          {t(TR.cashflow.backToCurrentCycle)}
        </button>
      )}
    </span>
  );
}
