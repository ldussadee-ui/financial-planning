"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt } from "@/lib/calc";
import { useHourlyWage } from "@/hooks/useHourlyWage";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { useBudgets } from "@/hooks/useBudgets";
import { SectionHeader, Field, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { CashflowExportImport } from "./CashflowExportImport";
import { AssetExportImport } from "./AssetExportImport";
import pkg from "../../../package.json";

const syncButtonStyle = {
  border: "none", background: "#F5EFFF", color: "#7A5C9E",
  borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
} as const;

function SpendCompareSettings() {
  const { hourlyWage, autoWage, setAutoWage, manualWage, setManualWage, computedWage } = useHourlyWage();
  const { goal, goals, primaryGoalId, setPrimaryGoalId } = usePrimaryGoal();

  return (
    <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
      <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 4 }}>⏱️ เทียบรายจ่าย</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
        ใช้แสดงว่าแต่ละรายจ่ายเทียบเป็นกี่ชั่วโมงทำงาน และทำให้เป้าหมายเร็ว/ช้าลงกี่วัน
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={autoWage} onChange={(e) => setAutoWage(e.target.checked)} />
        คำนวณอัตโนมัติจากรายได้ Active ของรอบปัจจุบัน (ไม่รวมโบนัส) ÷ 160 ชม./เดือน
      </label>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ค่าแรง/ชั่วโมง (บาท)">
          {autoWage ? (
            <input readOnly value={hourlyWage || 0} style={{ ...inputStyle, background: "#F5F3EE", color: "var(--ink-soft)" }} />
          ) : (
            <CalcInput value={String(manualWage || "")} onChange={(v) => setManualWage(Number(v) || 0)} placeholder="0" />
          )}
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

      {!autoWage && computedWage > 0 && (
        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          แนะนำตอนนี้: {fmt(computedWage)}/ชม.
          <button type="button" onClick={() => setManualWage(computedWage)} style={syncButtonStyle}>ใช้ค่านี้</button>
        </div>
      )}
      {hourlyWage > 0 && <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 10 }}>ตอนนี้ใช้ {fmt(hourlyWage)}/ชั่วโมง</div>}
    </div>
  );
}

function BudgetSettings() {
  const categories = useLiveQuery(() => db.categories.where("entryType").equals("Expense").sortBy("order"), [], []);
  const { map, setBudget } = useBudgets();
  const [open, setOpen] = useState(false);
  const summary = map.size > 0 ? `ตั้งไว้แล้ว ${map.size} หมวด` : "ยังไม่ได้ตั้งงบ";

  return (
    <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
      <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          🎯 งบประมาณรายจ่าย
        </div>
        <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{summary}</span>
      </div>
      {open && (
        <>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "10px 0 14px" }}>
            ตั้งวงเงินต่อเดือนต่อหมวดหมู่ ปล่อยว่างไว้ = ไม่ตั้งงบหมวดนั้น
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(categories || []).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 22, textAlign: "center" }}>{c.icon}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{c.label}</span>
                <div style={{ width: 130 }}>
                  <CalcInput value={String(map.get(c.label) || "")} onChange={(v) => setBudget(c.label, Number(v) || 0)} placeholder="ไม่ตั้งงบ" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsTab() {
  return (
    <div>
      <SectionHeader title="Settings ⚙️" sub="นำเข้า/ส่งออกข้อมูล และตั้งค่าอื่นๆ ของแอป" />

      <SpendCompareSettings />
      <BudgetSettings />

      <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 4 }}>💸 รายรับ-จ่าย</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
          ส่งออก/นำเข้ารายการรายรับ-จ่ายตามช่วงวันที่ — ใช้รวมข้อมูลจากหลายคนในครอบครัว
        </div>
        <CashflowExportImport />
      </div>

      <div className="fp-card" style={{ padding: 26 }}>
        <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 4 }}>🏦 สินทรัพย์</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
          ส่งออก/นำเข้าสินทรัพย์สภาพคล่อง เพื่อการลงทุน ส่วนตัว และหนี้สินทั้งหมด — ใช้ย้ายข้อมูลข้ามเบราว์เซอร์/เครื่อง
        </div>
        <AssetExportImport />
      </div>

      <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: 18 }}>
        เวอร์ชัน {pkg.version}
      </div>
    </div>
  );
}
