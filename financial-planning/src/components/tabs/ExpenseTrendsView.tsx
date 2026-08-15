"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/calc";
import { ICON_MAP } from "@/lib/constants";
import { defaultPeriod, shiftPeriod, periodLabel, type Granularity, type Period } from "@/lib/period";
import { useExpensePeriod } from "@/hooks/useExpensePeriod";
import { SectionHeader, StatRow, EmptyState } from "@/components/ui";

const CATEGORY_PALETTE = ["#FF9AA2", "#7FD1C9", "#B4A7F5", "#FFD8A8", "#B7E4C7", "#A0CED9", "#BFE3F0", "#FFE29A", "#FFAFCC", "#C9B8FF", "#FFB5A7"];

const GRANULARITY_LABEL: Record<Granularity, string> = { month: "เดือน", halfYear: "ครึ่งปี", year: "ปี" };

function toggleStyle(active: boolean): CSSProperties {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "#7FD1C9" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36,
  };
}
const navButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, width: 32, height: 32, fontSize: 14, cursor: "pointer",
};

export function ExpenseTrendsView() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [period, setPeriod] = useState<Period>(() => defaultPeriod("month"));
  const { total, fixedTotal, variableTotal, investTotal, byCategory, loading } = useExpensePeriod(period);

  const changeGranularity = (g: Granularity) => { setGranularity(g); setPeriod(defaultPeriod(g)); };

  if (loading) return null;

  return (
    <div>
      <Link
        href="/cashflow"
        aria-label="กลับไปรายรับ-จ่าย"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%",
          background: "#F5EFFF", color: "#7A5C9E", marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} />
      </Link>
      <SectionHeader title="สรุปรายจ่ายตามช่วงเวลา 📊" sub="ดูว่าช่วงนั้นจ่ายอะไรไปบ้าง แยกประจำ/ผันแปร/ออมและลงทุน และแยกตามหมวดหมู่" />

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["month", "halfYear", "year"] as Granularity[]).map((g) => (
          <button key={g} type="button" onClick={() => changeGranularity(g)} style={toggleStyle(granularity === g)}>
            ราย{GRANULARITY_LABEL[g]}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
        <button type="button" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} style={navButtonStyle} aria-label="ช่วงก่อนหน้า">‹</button>
        <div className="fp-display" style={{ fontSize: 17, fontWeight: 700, color: "#6B5490", minWidth: 160, textAlign: "center" }}>
          {periodLabel(period)}
        </div>
        <button type="button" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} style={navButtonStyle} aria-label="ช่วงถัดไป">›</button>
      </div>

      <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 8 }}>💸 ภาพรวมรายจ่าย</div>
        <StatRow label="รวมทั้งหมด" value={fmt(total)} big />
        <StatRow label="🔒 รายจ่ายประจำ (คงที่)" value={fmt(fixedTotal)} />
        <StatRow label="🎈 รายจ่ายผันแปร" value={fmt(variableTotal)} />
        <StatRow label="🌱 ออมและลงทุน" value={fmt(investTotal)} />
      </div>

      <div className="fp-card" style={{ padding: 26 }}>
        <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 8 }}>🏷️ แยกตามหมวดหมู่</div>
        {byCategory.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={byCategory} dataKey="amount" nameKey="category" innerRadius={40} outerRadius={72} paddingAngle={4} cornerRadius={6}>
                  {byCategory.map((c, i) => <Cell key={c.category} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, minWidth: 220, fontSize: 12.5 }}>
              {byCategory.map((c, i) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], flexShrink: 0 }} />
                  <span>{ICON_MAP[c.category] || "🏷️"}</span>
                  <span style={{ color: "var(--ink)" }}>{c.category}</span>
                  <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>({c.count} รายการ)</span>
                  <span className="fp-num" style={{ marginLeft: "auto", fontWeight: 600 }}>{fmt(c.amount)}</span>
                  <span className="fp-num" style={{ width: 40, textAlign: "right", color: "var(--ink-soft)" }}>
                    {total > 0 ? ((c.amount / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState text="ยังไม่มีรายจ่ายในช่วงนี้" />
        )}
      </div>
    </div>
  );
}
