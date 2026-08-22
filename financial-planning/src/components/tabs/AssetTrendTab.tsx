"use client";

import { useState, type CSSProperties } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/calc";
import { useNetWorthTrend } from "@/hooks/useNetWorthTrend";
import { useNetWorthTable } from "@/hooks/useNetWorthTable";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { SectionHeader, EmptyState, SegmentedControl } from "@/components/ui";
import type { AssetGranularity } from "@/lib/netWorthBuckets";

const GRANULARITY_COUNT: Record<AssetGranularity, number> = { month: 6, quarter: 4, halfYear: 4, year: 5 };

const compactAmount = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n / 1000) + "k" : String(n));

const thStyle: CSSProperties = { textAlign: "right", padding: "8px 10px", fontSize: 12, color: "var(--ink-soft)", fontWeight: 600, whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "8px 10px", whiteSpace: "nowrap" };
const tdNumStyle: CSSProperties = { ...tdStyle, textAlign: "right", fontFamily: "var(--font-prompt), 'Prompt', sans-serif" };

export function AssetTrendTab() {
  const { lang, t } = useLanguage();
  const [granularity, setGranularity] = useState<AssetGranularity>("month");
  const [tableCount, setTableCount] = useState(6);
  const { points, loading: chartLoading } = useNetWorthTrend(granularity, GRANULARITY_COUNT[granularity], lang);
  const { rows, loading: tableLoading } = useNetWorthTable(tableCount, lang);

  if (chartLoading || tableLoading) return null;

  const SERIES = [
    { key: "assets", name: t(TR.assets.assetsAll), color: "#7FB8D9" },
    { key: "liab", name: t(TR.assets.liabAll), color: "#FF8C7A" },
    { key: "netWorth", name: "Net Worth", color: "#0F6E56" },
  ] as const;
  const GRANULARITY_OPTIONS: { value: AssetGranularity; label: string }[] = [
    { value: "month", label: t(TR.assets.granMonth) }, { value: "quarter", label: t(TR.assets.granQuarter) },
    { value: "halfYear", label: t(TR.assets.granHalfYear) }, { value: "year", label: t(TR.assets.granYear) },
  ];
  const TABLE_COUNT_OPTIONS = [3, 6, 12, 24].map((n) => ({ value: String(n), label: `${n}${lang === "en" ? "mo" : " ด."}` }));

  return (
    <div>
      <SectionHeader title={t(TR.assets.trendTitle)} sub={t(TR.assets.trendSub)} />

      <div style={{ marginBottom: 18 }}>
        <SegmentedControl options={GRANULARITY_OPTIONS} value={granularity} onChange={setGranularity} />
      </div>

      <div className="fp-card" style={{ padding: 20, marginBottom: 18 }}>
        {points.some((p) => p.assets !== null) ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} width={36} tickFormatter={compactAmount} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              {/* itemSorter default ("value") sorts alphabetically, which puts the
                  Latin "Net Worth" ahead of the Thai labels regardless of Bar order */}
              <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text={t(TR.assets.noHistory)} />
        )}
      </div>

      <div className="fp-card" style={{ padding: 20, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600 }}>{t(TR.assets.comparisonTable)}</div>
          <div style={{ width: 200 }}>
            <SegmentedControl small options={TABLE_COUNT_OPTIONS} value={String(tableCount)} onChange={(v) => setTableCount(Number(v))} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ ...thStyle, textAlign: "left" }}>{t(TR.assets.month)}</th>
                <th style={thStyle}>{t(TR.assets.totalAssets)}</th>
                <th style={thStyle}>{t(TR.assets.totalLiab)}</th>
                <th style={thStyle}>Net Worth</th>
                <th style={thStyle}>{t(TR.assets.deltaVsPrev)}</th>
                <th style={thStyle}>{t(TR.assets.pctVsPrev)}</th>
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
