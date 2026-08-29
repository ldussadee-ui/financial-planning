"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { categoryBudgetStatus, daysFasterToGoal, fmt, fmtRange, getCycleRange, hoursOfWork } from "@/lib/calc";
import { ICON_MAP } from "@/lib/constants";
import { useSetting } from "@/hooks/useSetting";
import { useHourlyWage } from "@/hooks/useHourlyWage";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { useBudgets } from "@/hooks/useBudgets";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, CATEGORY_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, NestedGroup, DayPicker, BudgetBar } from "@/components/ui";
import { renderByDay } from "./cashflowShared";
import { useCashflowEntry } from "./CashflowEntryModal";
import type { CashFlowEntry } from "@/lib/types";

function chipStyle(active: boolean): CSSProperties {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "#7FD1C9" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
  };
}
const navButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, width: 26, height: 26, fontSize: 13, cursor: "pointer", lineHeight: "1",
};
const sum = (arr: CashFlowEntry[]) => arr.reduce((s, c) => s + Number(c.amount || 0), 0);

export function CashflowTab() {
  const { lang, t } = useLanguage();
  const [cycleStartDay, setCycleStartDay] = useSetting<number>("cycleStartDay", 1);
  const [shiftWeekend, setShiftWeekend] = useSetting<boolean>("shiftWeekend", false);
  const [cycleOffset, setCycleOffset] = useState(0);
  const hiddenAtRef = useRef<number | null>(null);
  useEffect(() => {
    // A PWA/mobile browser tab is usually suspended rather than fully
    // closed when the user "leaves" it, so this component never remounts
    // (which would otherwise reset cycleOffset via its useState initial
    // value). Treat a long-enough hide as the user having actually closed
    // and later reopened the app, and snap back to the current cycle; a
    // brief switch to another app and back leaves the selected month alone.
    const RESET_AFTER_HIDDEN_MS = 10 * 60 * 1000;
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current !== null) {
        if (Date.now() - hiddenAtRef.current > RESET_AFTER_HIDDEN_MS) setCycleOffset(0);
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  const cycleRange = useMemo(() => {
    // Step cycle-by-cycle from the real current cycle rather than adding
    // `cycleOffset` months to today's date at a fixed day-of-month: a fixed
    // anchor day breaks once cycleStartDay is past it (e.g. day 15 reads as
    // "before" a cycle that starts on the 25th even after today has crossed
    // it, understating the current cycle by one) and adding months to a
    // day-of-month like 31 can overflow into the wrong month. One day past
    // the end of the current cycle is always inside the next one, and vice
    // versa, so this works for any cycleStartDay.
    let range = getCycleRange(cycleStartDay, shiftWeekend);
    if (cycleOffset > 0) {
      for (let i = 0; i < cycleOffset; i++) {
        const nextRef = new Date(range.end);
        nextRef.setDate(nextRef.getDate() + 1);
        range = getCycleRange(cycleStartDay, shiftWeekend, nextRef);
      }
    } else if (cycleOffset < 0) {
      for (let i = 0; i < -cycleOffset; i++) {
        const prevRef = new Date(range.start);
        prevRef.setDate(prevRef.getDate() - 1);
        range = getCycleRange(cycleStartDay, shiftWeekend, prevRef);
      }
    }
    return range;
  }, [cycleStartDay, shiftWeekend, cycleOffset]);
  const { hourlyWage } = useHourlyWage();
  const { goal: primaryGoal, linked: primaryGoalLinked } = usePrimaryGoal();
  const { map: budgetMap } = useBudgets();
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const { openEdit, editingId, closeModal } = useCashflowEntry();

  const expenseExtra = (c: CashFlowEntry) => {
    const parts: string[] = [];
    const hours = hoursOfWork(c.amount, hourlyWage);
    if (hours !== null) parts.push(lang === "en" ? `≈ ${hours.toFixed(1)} hrs` : `≈ ${hours.toFixed(1)} ชม.`);
    if (primaryGoal) {
      const daysFaster = daysFasterToGoal(c.amount, primaryGoal, primaryGoalLinked);
      if (daysFaster !== null) {
        parts.push(lang === "en"
          ? `${daysFaster.toFixed(1)}d faster (${primaryGoal.name})`
          : `เร็วขึ้น ${daysFaster.toFixed(1)} วัน (${primaryGoal.name})`);
      }
    }
    return parts.length ? parts.join(" · ") : null;
  };

  const remove = (id: string) => {
    if (editingId === id) closeModal();
    void db.cashflow.delete(id);
  };

  const cycleCF = (cashflow || []).filter((c) => {
    const d = new Date(c.date + "T00:00:00");
    return d >= cycleRange.start && d <= cycleRange.end;
  });
  const income = cycleCF.filter((c) => c.type === "Income");
  const incomeActive = income.filter((c) => c.incomeClass === "Active");
  const incomePassive = income.filter((c) => c.incomeClass === "Passive");
  const fixedExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class === "Fixed");
  const investExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class === "Invest");
  const varExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class !== "Fixed" && c.expense_class !== "Invest");
  const budgetStatus = categoryBudgetStatus(cycleCF, budgetMap);
  const isCurrentCycle = cycleOffset === 0;

  return (
    <div>
      <SectionHeader title={t(TR.cashflow.title)} sub={t(TR.cashflow.subtitle)} />

      <div className="fp-card" style={{ padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-soft)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button type="button" onClick={() => setCycleOffset((o) => o - 1)} style={navButtonStyle} aria-label={t(TR.cashflow.prevCycle)}>‹</button>
          🗓️ {isCurrentCycle ? t(TR.cashflow.currentCycle) : t(TR.cashflow.cycle)}: <b style={{ color: "var(--ink)" }}>{fmtRange(cycleRange, lang)}</b>
          <button type="button" onClick={() => setCycleOffset((o) => o + 1)} style={navButtonStyle} aria-label={t(TR.cashflow.nextCycle)}>›</button>
          {!isCurrentCycle && (
            <button type="button" onClick={() => setCycleOffset(0)} style={{ ...chipStyle(false), padding: "5px 11px", fontSize: 11.5 }}>
              {t(TR.cashflow.backToCurrentCycle)}
            </button>
          )}
        </span>
        <DayPicker value={cycleStartDay} onChange={setCycleStartDay} shiftWeekend={shiftWeekend} onShiftWeekendChange={setShiftWeekend} />
        <span style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Link href="/cashflow/reports" style={{ ...chipStyle(false), textDecoration: "none" }}>
            📊 {t(TR.cashflow.monthlyReport)}
          </Link>
          <Link href="/cashflow/payment-summary" style={{ ...chipStyle(false), textDecoration: "none" }}>
            💳 {t(TR.cashflow.paymentSummary)}
          </Link>
        </span>
      </div>

      <NestedGroup
        label={t(TR.cashflow.income)}
        amount={fmt(sum(incomeActive) + sum(incomePassive))}
        accent="#0F6E56"
        tint="#EFFBF6"
        subGroups={[
          { label: "Active", amount: fmt(sum(incomeActive)), dot: "#0F6E56", items: renderByDay(incomeActive, remove, openEdit, undefined, lang) },
          { label: "Passive", amount: fmt(sum(incomePassive)), dot: "#5FA98A", items: renderByDay(incomePassive, remove, openEdit, undefined, lang) },
        ]}
      />
      <NestedGroup
        label={t(TR.cashflow.expense)}
        amount={fmt(sum(fixedExp) + sum(varExp) + sum(investExp))}
        accent="#D07A4E"
        tint="#FFEFE6"
        subGroups={[
          { label: lang === "en" ? "Fixed" : "Fixed (ประจำ)", amount: fmt(sum(fixedExp)), dot: "#D07A4E", items: renderByDay(fixedExp, remove, openEdit, expenseExtra, lang) },
          { label: lang === "en" ? "General" : "ทั่วไป", amount: fmt(sum(varExp)), dot: "#E3A874", items: renderByDay(varExp, remove, openEdit, expenseExtra, lang) },
          { label: lang === "en" ? "Savings & Investing" : "ออมและลงทุน", amount: fmt(sum(investExp)), dot: "#0F6E56", items: renderByDay(investExp, remove, openEdit, expenseExtra, lang) },
        ]}
      />

      {budgetStatus.length > 0 && (
        <div className="fp-card" style={{ padding: 20, marginTop: 18 }}>
          <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 12 }}>🎯 {t(TR.cashflow.budgetThisCycle)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {budgetStatus.map((b) => (
              <div key={b.category}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                  <span>{ICON_MAP[b.category] || "🏷️"}</span>
                  <span>{translateLabel(b.category, lang, CATEGORY_LABEL_EN)}</span>
                </div>
                <BudgetBar spent={b.spent} budget={b.budget} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
        {t(TR.cashflow.footnote)}
      </div>
    </div>
  );
}
