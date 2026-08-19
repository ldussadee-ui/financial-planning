"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { categoryBudgetStatus, daysFasterToGoal, fmt, fmtRange, getCycleRange, hoursOfWork } from "@/lib/calc";
import { ICON_MAP } from "@/lib/constants";
import { useSetting } from "@/hooks/useSetting";
import { useHourlyWage } from "@/hooks/useHourlyWage";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { useBudgets } from "@/hooks/useBudgets";
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
  const [cycleStartDay, setCycleStartDay] = useSetting<number>("cycleStartDay", 1);
  const [shiftWeekend, setShiftWeekend] = useSetting<boolean>("shiftWeekend", false);
  const [cycleOffset, setCycleOffset] = useState(0);
  const cycleRange = useMemo(() => {
    const today = new Date();
    const ref = new Date(today.getFullYear(), today.getMonth() + cycleOffset, 15);
    return getCycleRange(cycleStartDay, shiftWeekend, ref);
  }, [cycleStartDay, shiftWeekend, cycleOffset]);
  const { hourlyWage } = useHourlyWage();
  const { goal: primaryGoal, linked: primaryGoalLinked } = usePrimaryGoal();
  const { map: budgetMap } = useBudgets();
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const { openEdit, editingId, closeModal } = useCashflowEntry();

  const expenseExtra = (c: CashFlowEntry) => {
    const parts: string[] = [];
    const hours = hoursOfWork(c.amount, hourlyWage);
    if (hours !== null) parts.push(`≈ ${hours.toFixed(1)} ชม.`);
    if (primaryGoal) {
      const daysFaster = daysFasterToGoal(c.amount, primaryGoal, primaryGoalLinked);
      if (daysFaster !== null) parts.push(`เร็วขึ้น ${daysFaster.toFixed(1)} วัน (${primaryGoal.name})`);
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
      <SectionHeader title="รายรับ-จ่าย 💸" sub="รายรับแยก Active/Passive และรายจ่ายแยกประจำ/ทั่วไป/ออมและลงทุนให้อัตโนมัติ" />

      <div className="fp-card" style={{ padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-soft)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button type="button" onClick={() => setCycleOffset((o) => o - 1)} style={navButtonStyle} aria-label="รอบก่อนหน้า">‹</button>
          🗓️ {isCurrentCycle ? "รอบบัญชีปัจจุบัน" : "รอบบัญชี"}: <b style={{ color: "var(--ink)" }}>{fmtRange(cycleRange)}</b>
          <button type="button" onClick={() => setCycleOffset((o) => o + 1)} style={navButtonStyle} aria-label="รอบถัดไป">›</button>
          {!isCurrentCycle && (
            <button type="button" onClick={() => setCycleOffset(0)} style={{ ...chipStyle(false), padding: "5px 11px", fontSize: 11.5 }}>
              กลับไปรอบปัจจุบัน
            </button>
          )}
        </span>
        <DayPicker value={cycleStartDay} onChange={setCycleStartDay} shiftWeekend={shiftWeekend} onShiftWeekendChange={setShiftWeekend} />
        <span style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Link href="/cashflow/reports" style={{ ...chipStyle(false), textDecoration: "none" }}>
            📊 สรุปรายจ่ายรายเดือน →
          </Link>
          <Link href="/cashflow/payment-summary" style={{ ...chipStyle(false), textDecoration: "none" }}>
            💳 สรุปการจ่ายต่อช่องทาง →
          </Link>
        </span>
      </div>

      <NestedGroup
        label="Income"
        amount={fmt(sum(incomeActive) + sum(incomePassive))}
        accent="#0F6E56"
        tint="#EFFBF6"
        subGroups={[
          { label: "Active", amount: fmt(sum(incomeActive)), dot: "#0F6E56", items: renderByDay(incomeActive, remove, openEdit) },
          { label: "Passive", amount: fmt(sum(incomePassive)), dot: "#5FA98A", items: renderByDay(incomePassive, remove, openEdit) },
        ]}
      />
      <NestedGroup
        label="Expense"
        amount={fmt(sum(fixedExp) + sum(varExp) + sum(investExp))}
        accent="#D07A4E"
        tint="#FFEFE6"
        subGroups={[
          { label: "Fixed (ประจำ)", amount: fmt(sum(fixedExp)), dot: "#D07A4E", items: renderByDay(fixedExp, remove, openEdit, expenseExtra) },
          { label: "ทั่วไป", amount: fmt(sum(varExp)), dot: "#E3A874", items: renderByDay(varExp, remove, openEdit, expenseExtra) },
          { label: "ออมและลงทุน", amount: fmt(sum(investExp)), dot: "#0F6E56", items: renderByDay(investExp, remove, openEdit, expenseExtra) },
        ]}
      />

      {budgetStatus.length > 0 && (
        <div className="fp-card" style={{ padding: 20, marginTop: 18 }}>
          <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 12 }}>🎯 งบประมาณรอบนี้</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {budgetStatus.map((b) => (
              <div key={b.category}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                  <span>{ICON_MAP[b.category] || "🏷️"}</span>
                  <span>{b.category}</span>
                </div>
                <BudgetBar spent={b.spent} budget={b.budget} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
        * แสดงเฉพาะรายการในรอบบัญชีที่เลือกด้านบน (เลื่อน ‹ › ดูรอบอื่นได้) · รายจ่ายแยกประจำ/ทั่วไป/ออมและลงทุนจากคำในหมวดหมู่ รายรับแยก Active/Passive อัตโนมัติเช่นกัน · แตะรายการเพื่อแก้ไข
      </div>
    </div>
  );
}
