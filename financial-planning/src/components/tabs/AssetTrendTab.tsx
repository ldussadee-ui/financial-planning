"use client";

import { useState, type CSSProperties } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/calc";
import { useNetWorthTrend } from "@/hooks/useNetWorthTrend";
import { useNetWorthTable } from "@/hooks/useNetWorthTable";
import { SectionHeader, EmptyState } from "@/components/ui";
import type { AssetGranularity } from "@/lib/netWorthBuckets";

const SERIES = [
  { key: "assets", name: "สินทรัพย์ทั้งหมด", color: "#7FB8D9" },
  { key: "liab", name: "หนี้สินทั้งหมด", color: "#FF8C7A" },
  { key: "netWorth", name: "Net Worth", color: "#0F6E56" },
] as const;

const GRANULARITY_LABEL: Record<AssetGranularity, string> = {
  month: "รายเดือน", quarter: "รายไตรมาส", halfYear: "รายครึ่งปี", year: "รายปี",
};
const GRANULARITY_COUNT: Record<AssetGranularity, number> = { month: 6, quarter: 4, halfYear: 4, year: 5 };
const TABLE_COUNTS = [3, 6, 12, 24];

const compactAmount = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n / 1000) + "k" : String(n));

function toggleStyle(active: boolean): CSSProperties {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "#7FD1C9" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36,
  };
}
const smallToggleStyle = (active: boolean): CSSProperties => ({ ...toggleStyle(active), padding: "5px 11px", fontSize: 12, height: 28 });

const thStyle: CSSProperties = { textAlign: "right", padding: "8px 10px", fontSize: 12, color: "var(--ink-soft)", fontWeight: 600, whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "8px 10px", whiteSpace: "nowrap" };
const tdNumStyle: CSSProperties = { ...tdStyle, textAlign: "right", fontFamily: "var(--font-prompt), 'Prompt', sans-serif" };

export function AssetTrendTab() {
  const [granularity, setGranularity] = useState<AssetGranularity>("month");
  const [tableCount, setTableCount] = useState(6);
  const { points, loading: chartLoading } = useNetWorthTrend(granularity, GRANULARITY_COUNT[granularity]);
  const { rows, loading: tableLoading } = useNetWorthTable(tableCount);

  if (chartLoading || tableLoading) return null;

  return (
    <div>
      <SectionHeader title="แนวโน้มทรัพย์สิน 📉" sub="เทียบมูลค่าทรัพย์สินย้อนหลัง จาก snapshot ล่าสุดที่บันทึกไว้ในแต่ละช่วง — เริ่มนับจากวันนี้เป็นต้นไป" />

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {(["month", "quarter", "halfYear", "year"] as AssetGranularity[]).map((g) => (
          <button key={g} type="button" onClick={() => setGranularity(g)} style={toggleStyle(granularity === g)}>
            {GRANULARITY_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="fp-card" style={{ padding: 20, marginBottom: 18 }}>
        {points.some((p) => p.assets !== null) ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} width={36} tickFormatter={compactAmount} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="ยังไม่มีข้อมูลย้อนหลัง" />
        )}
      </div>

      <div className="fp-card" style={{ padding: 20, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600 }}>ตารางเปรียบเทียบรายเดือน</div>
          <div style={{ display: "flex", gap: 6 }}>
            {TABLE_COUNTS.map((n) => (
              <button key={n} type="button" onClick={() => setTableCount(n)} style={smallToggleStyle(tableCount === n)}>
                {n} ด.
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ ...thStyle, textAlign: "left" }}>เดือน</th>
                <th style={thStyle}>สินทรัพย์</th>
                <th style={thStyle}>หนี้สิน</th>
                <th style={thStyle}>Net Worth</th>
                <th style={thStyle}>Δ เทียบเดือนก่อน</th>
                <th style={thStyle}>% เทียบเดือนก่อน</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={tdStyle}>{r.label}</td>
                  <td style={tdNumStyle}>{r.assets !== null ? fmt(r.assets) : "—"}</td>
                  <td style={tdNumStyle}>{r.liab !== null ? fmt(r.liab) : "—"}</td>
                  <td style={tdNumStyle}>{r.netWorth !== null ? fmt(r.netWorth) : "—"}</td>
                  <td style={{ ...tdNumStyle, color: r.delta === null ? undefined : r.delta >= 0 ? "#0F6E56" : "#FF8C7A" }}>
                    {r.delta !== null ? (r.delta >= 0 ? "+" : "") + fmt(r.delta) : "—"}
                  </td>
                  <td style={{ ...tdNumStyle, color: r.pct === null ? undefined : r.pct >= 0 ? "#0F6E56" : "#FF8C7A" }}>
                    {r.pct !== null ? (r.pct >= 0 ? "+" : "") + r.pct.toFixed(1) + "%" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
