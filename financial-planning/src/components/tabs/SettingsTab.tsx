"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt } from "@/lib/calc";
import { useSetting } from "@/hooks/useSetting";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { SectionHeader, Field, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { CashflowExportImport } from "./CashflowExportImport";
import { AssetExportImport } from "./AssetExportImport";

const GUESS_HOURS_PER_MONTH = 160;

// Guides the user with a starting number derived from their latest เงินเดือน
// entry (÷ 160 hrs/month), but only ever writes it once — the moment
// hourlyWage becomes non-zero (by this guess or a manual edit), the guess
// stops touching it, so edits always stick.
function SpendCompareSettings() {
  const [hourlyWage, setHourlyWage] = useSetting<number>("hourlyWage", 0);
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const { goal, goals, primaryGoalId, setPrimaryGoalId } = usePrimaryGoal();

  useEffect(() => {
    if (hourlyWage > 0 || !cashflow) return;
    const salaryEntries = cashflow
      .filter((c) => c.type === "Income" && c.category === "เงินเดือน")
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (salaryEntries.length) {
      setHourlyWage(Math.round(salaryEntries[0].amount / GUESS_HOURS_PER_MONTH));
    }
  }, [hourlyWage, cashflow, setHourlyWage]);

  return (
    <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
      <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 4 }}>⏱️ เทียบรายจ่าย</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
        ใช้แสดงว่าแต่ละรายจ่ายเทียบเป็นกี่ชั่วโมงทำงาน และทำให้เป้าหมายเร็ว/ช้าลงกี่วัน — ประเมินเริ่มต้นให้จากเงินเดือนล่าสุด ({GUESS_HOURS_PER_MONTH} ชม./เดือน) แก้ไขเองได้เสมอ
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ค่าแรง/ชั่วโมง (บาท)">
          <CalcInput value={String(hourlyWage || "")} onChange={(v) => setHourlyWage(Number(v) || 0)} placeholder="0" />
        </Field>
        <Field label="เป้าหมายหลัก">
          {goals.length ? (
            <select
              value={goal?.id || ""}
              onChange={(e) => setPrimaryGoalId(e.target.value || null)}
              style={inputStyle}
            >
              {!primaryGoalId && <option value="">— อัตโนมัติ: {goal?.name} —</option>}
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>ยังไม่มีเป้าหมาย</div>
          )}
        </Field>
      </div>
      {hourlyWage > 0 && <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 10 }}>ตอนนี้ใช้ {fmt(hourlyWage)}/ชั่วโมง</div>}
    </div>
  );
}

export function SettingsTab() {
  return (
    <div>
      <SectionHeader title="Settings ⚙️" sub="นำเข้า/ส่งออกข้อมูล และตั้งค่าอื่นๆ ของแอป" />

      <SpendCompareSettings />

      <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 4 }}>💸 รายรับ-จ่าย</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
          ส่งออก/นำเข้ารายการรายรับ-จ่ายตามช่วงวันที่ — ใช้รวมข้อมูลจากหลายคนในครอบครัว
        </div>
        <CashflowExportImport />
      </div>

      <div className="fp-card" style={{ padding: 26 }}>
        <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 4 }}>🏦 สินทรัพย์</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
          ส่งออก/นำเข้าสินทรัพย์สภาพคล่อง เพื่อการลงทุน ส่วนตัว และหนี้สินทั้งหมด — ใช้ย้ายข้อมูลข้ามเบราว์เซอร์/เครื่อง
        </div>
        <AssetExportImport />
      </div>
    </div>
  );
}
