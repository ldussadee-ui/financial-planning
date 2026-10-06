"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { cycleRangeAtOffset, fmt, parseCycleOffset } from "@/lib/calc";
import { usePaymentGroups, type PaymentGroup } from "@/hooks/usePaymentGroups";
import { useSetting } from "@/hooks/useSetting";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, PAYMENT_METHOD_LABEL_EN, translateLabel, type Language } from "@/lib/i18n";
import { SectionHeader, Group, EmptyState } from "@/components/ui";
import { CycleNav } from "@/components/CycleNav";
import { renderByDay } from "./cashflowShared";

// Each group gets its own background so neighbouring cards can be told
// apart at a glance — they all used to share one lavender. Cash is always
// the same green; cards take the next colour along; a group that doesn't
// say how it was paid stays a plain warm grey.
const CASH_TINT = "#E3F4EA";
const UNSPECIFIED_TINT = "#F1EDE8";
const CARD_TINTS = ["#EDE6FF", "#FFE9DA", "#DFEFF8", "#FFE6EC", "#FFF3CF", "#E6EAFF", "#F3E6F6"];

function groupTint(group: PaymentGroup, index: number): string {
  if (group.kind === "เงินสด") return CASH_TINT;
  if (group.kind === null) return UNSPECIFIED_TINT;
  return CARD_TINTS[index % CARD_TINTS.length];
}

function groupTitle(group: PaymentGroup, lang: Language, unspecified: string): string {
  const icon = group.kind === "เงินสด" ? "💵" : group.kind === null ? "❔" : "💳";
  const name = group.kind === null ? unspecified : translateLabel(group.name, lang, PAYMENT_METHOD_LABEL_EN);
  return `${icon} ${name}${group.owner ? ` · ${group.owner}` : ""}`;
}

export function PaymentSummaryView() {
  const { lang, t } = useLanguage();
  const [cycleStartDay] = useSetting<number>("cycleStartDay", 1);
  const [shiftWeekend] = useSetting<boolean>("shiftWeekend", false);
  // Opens on whichever cycle the cashflow tab was showing when its link was
  // tapped; stepping from there is local to this page, so the browser's
  // back button still returns to the cashflow tab rather than walking back
  // through every cycle visited here.
  const searchParams = useSearchParams();
  const [cycleOffset, setCycleOffset] = useState(() => parseCycleOffset(searchParams.get("cycle")));
  const cycleRange = useMemo(
    () => cycleRangeAtOffset(cycleStartDay, shiftWeekend, cycleOffset),
    [cycleStartDay, shiftWeekend, cycleOffset],
  );
  const { paymentGroups, loading } = usePaymentGroups(cycleRange);
  const remove = (id: string) => void db.cashflow.delete(id);

  if (loading) return null;

  const total = paymentGroups.reduce((s, g) => s + g.items.reduce((s2, c) => s2 + c.amount, 0), 0);

  return (
    <div>
      <Link
        href="/cashflow"
        aria-label={t(TR.reports.backToCashflow)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%",
          background: "#F5EFFF", color: "#7A5C9E", marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} />
      </Link>
      <SectionHeader title={t(TR.reports.paymentSummaryTitle)} sub={t(TR.reports.paymentSummarySub)} />

      {/* The total changes with the cycle, so it sits under the control that
          changes it rather than in the subtitle above. */}
      <div className="fp-card" style={{ padding: "13px 16px", marginBottom: 18, fontSize: 12.5, color: "var(--ink-soft)" }}>
        <CycleNav offset={cycleOffset} range={cycleRange} onChange={setCycleOffset} />
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            borderTop: "1px dashed var(--line)", marginTop: 11, paddingTop: 10,
          }}
        >
          <span>{t(TR.reports.cycleTotal)}</span>
          <span className="fp-num" style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{fmt(total)}</span>
        </div>
      </div>

      {paymentGroups.length ? (
        paymentGroups.map((group, i) => (
          <Group
            key={group.key}
            title={groupTitle(group, lang, t(TR.reports.unspecifiedMethod))}
            amount={fmt(group.items.reduce((s, c) => s + c.amount, 0))}
            tint={groupTint(group, i)}
          >
            {renderByDay(group.items, remove, undefined, undefined, lang)}
          </Group>
        ))
      ) : (
        <div className="fp-card" style={{ padding: 10 }}>
          <EmptyState text={t(TR.reports.noPaymentEntries)} />
        </div>
      )}
    </div>
  );
}
