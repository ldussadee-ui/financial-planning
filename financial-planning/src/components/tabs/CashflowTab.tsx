"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, fmtRange } from "@/lib/calc";
import { useMetrics } from "@/hooks/useMetrics";
import { useSetting } from "@/hooks/useSetting";
import { SectionHeader, NestedGroup, DayPicker } from "@/components/ui";
import { renderByDay } from "./cashflowShared";
import { useCashflowEntry } from "./CashflowEntryModal";
import { CashflowExportImport } from "./CashflowExportImport";

function chipStyle(active: boolean): CSSProperties {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "#7FD1C9" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
  };
}

export function CashflowTab() {
  const { metrics, cycleRange } = useMetrics();
  const [cycleStartDay, setCycleStartDay] = useSetting<number>("cycleStartDay", 1);
  const [shiftWeekend, setShiftWeekend] = useSetting<boolean>("shiftWeekend", false);
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const { openEdit, editingId, closeModal } = useCashflowEntry();

  const remove = (id: string) => {
    if (editingId === id) closeModal();
    void db.cashflow.delete(id);
  };

  const cycleCF = (cashflow || []).filter((c) => {
    const d = new Date(c.date + "T00:00:00");
    return d >= cycleRange.start && d <= cycleRange.end;
  });
  const income = cycleCF.filter((c) => c.type === "Income");
  const fixedExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class === "Fixed");
  const investExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class === "Invest");
  const varExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class !== "Fixed" && c.expense_class !== "Invest");

  return (
    <div>
      <SectionHeader title="รายรับ-จ่าย 💸" sub="รายรับแยก Active/Passive และรายจ่ายแยกประจำ/ผันแปร/ออมและลงทุนให้อัตโนมัติ" />

      <div className="fp-card" style={{ padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-soft)" }}>
        <span>🗓️ รอบบัญชีปัจจุบัน: <b style={{ color: "var(--ink)" }}>{fmtRange(cycleRange)}</b></span>
        <DayPicker value={cycleStartDay} onChange={setCycleStartDay} shiftWeekend={shiftWeekend} onShiftWeekendChange={setShiftWeekend} />
        <span style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Link href="/cashflow/reports" style={{ ...chipStyle(false), textDecoration: "none" }}>
            📊 สรุปรายจ่ายรายเดือน →
          </Link>
          <Link href="/cashflow/payment-summary" style={{ ...chipStyle(false), textDecoration: "none" }}>
            💳 สรุปการจ่ายต่อช่องทาง →
          </Link>
          <CashflowExportImport />
        </span>
      </div>

      <NestedGroup
        title={`Income — ${fmt(metrics.incomeActive + metrics.incomePassive)}`}
        tint="#EFFBF6"
        subGroups={[
          { label: `Active — ${fmt(metrics.incomeActive)}`, items: renderByDay(income.filter((c) => c.incomeClass === "Active"), remove, openEdit) },
          { label: `Passive — ${fmt(metrics.incomePassive)}`, items: renderByDay(income.filter((c) => c.incomeClass === "Passive"), remove, openEdit) },
        ]}
      />
      <NestedGroup
        title={`Expense — ${fmt(metrics.expenseFixed + metrics.expenseVariable + metrics.expenseInvest)}`}
        tint="#FFEFE6"
        subGroups={[
          { label: `🔒 Fixed (ประจำ) — ${fmt(metrics.expenseFixed)}`, items: renderByDay(fixedExp, remove, openEdit) },
          { label: `🎈 Variable (ผันแปร) — ${fmt(metrics.expenseVariable)}`, items: renderByDay(varExp, remove, openEdit) },
          { label: `🌱 ออมและลงทุน — ${fmt(metrics.expenseInvest)}`, items: renderByDay(investExp, remove, openEdit) },
        ]}
      />

      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>
        * แสดงเฉพาะรายการในรอบบัญชีปัจจุบันด้านบน · รายจ่ายแยกประจำ/ผันแปร/ออมและลงทุนจากคำในหมวดหมู่ รายรับแยก Active/Passive อัตโนมัติเช่นกัน · แตะรายการเพื่อแก้ไข
      </div>
    </div>
  );
}
