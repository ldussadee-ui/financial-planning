"use client";

import type { CSSProperties, ReactNode } from "react";
import { fmtRange, type CycleRange } from "@/lib/calc";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { StepButton } from "@/components/ui";

const backToCurrentStyle: CSSProperties = {
  border: "2px solid var(--border)", background: "var(--panel)", color: "var(--ink-soft)",
  borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 500, cursor: "pointer",
};

// The ‹ cycle › stepper. Lives here rather than in the cashflow tab so every
// screen that moves through cycles uses one control that looks and behaves
// the same — the payment summary is reached from the cashflow tab, and a
// second, slightly different stepper there would be the first thing to drift.
// The row never wraps: the "current cycle" label sits in small type above the
// dates, and `trailing` (the cashflow tab's start-day picker) shares the line,
// so the whole control fits one line on a 375px phone.
export function CycleNav({
  offset, range, onChange, trailing,
}: {
  offset: number;
  range: CycleRange;
  onChange: (offset: number) => void;
  trailing?: ReactNode;
}) {
  const { lang, t } = useLanguage();
  const isCurrent = offset === 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, width: "100%" }}>
        <StepButton dir="prev" onClick={() => onChange(offset - 1)} label={t(TR.cashflow.prevCycle)} size={26} />
        <span style={{ flex: 1, minWidth: 0, textAlign: "center", lineHeight: 1.2 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)" }}>
            {isCurrent ? t(TR.cashflow.currentCycle) : t(TR.cashflow.cycle)}
          </span>
          <b style={{ display: "block", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {fmtRange(range, lang)}
          </b>
        </span>
        <StepButton dir="next" onClick={() => onChange(offset + 1)} label={t(TR.cashflow.nextCycle)} size={26} />
        {trailing && <span style={{ flexShrink: 0, marginLeft: 4 }}>{trailing}</span>}
      </div>
      {!isCurrent && (
        <button type="button" onClick={() => onChange(0)} style={backToCurrentStyle}>
          {t(TR.cashflow.backToCurrentCycle)}
        </button>
      )}
    </div>
  );
}
