"use client";

import type { CSSProperties } from "react";
import { fmtRange, type CycleRange } from "@/lib/calc";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { PopIcon } from "@/components/icons";
import { StepButton } from "@/components/ui";

const backToCurrentStyle: CSSProperties = {
  border: "2px solid var(--border)", background: "var(--panel)", color: "var(--ink-soft)",
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
      <StepButton dir="prev" onClick={() => onChange(offset - 1)} label={t(TR.cashflow.prevCycle)} size={26} />
      <PopIcon name="calendar" /> {isCurrent ? t(TR.cashflow.currentCycle) : t(TR.cashflow.cycle)}: <b style={{ color: "var(--ink)" }}>{fmtRange(range, lang)}</b>
      <StepButton dir="next" onClick={() => onChange(offset + 1)} label={t(TR.cashflow.nextCycle)} size={26} />
      {!isCurrent && (
        <button type="button" onClick={() => onChange(0)} style={backToCurrentStyle}>
          {t(TR.cashflow.backToCurrentCycle)}
        </button>
      )}
    </span>
  );
}
