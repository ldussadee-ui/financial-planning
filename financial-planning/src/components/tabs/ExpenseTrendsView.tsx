"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { fmt } from "@/lib/calc";
import { ICON_MAP } from "@/lib/constants";
import { defaultPeriod, shiftPeriod, periodLabel, type Granularity, type Period } from "@/lib/period";
import { useExpensePeriod } from "@/hooks/useExpensePeriod";
import { useBudgets } from "@/hooks/useBudgets";
import { useMonthlyCategoryTrend } from "@/hooks/useMonthlyCategoryTrend";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, CATEGORY_LABEL_EN, translateLabel, type Language } from "@/lib/i18n";
import { SectionHeader, StatRow, EmptyState, BudgetBar, SegmentedControl } from "@/components/ui";

const CATEGORY_PALETTE = ["#FF9AA2", "#7FD1C9", "#B4A7F5", "#FFD8A8", "#B7E4C7", "#A0CED9", "#BFE3F0", "#FFE29A", "#FFAFCC", "#C9B8FF", "#FFB5A7"];

// A category budget is a monthly figure; scale it to however many months
// the currently-viewed period spans so the comparison stays meaningful.
const MONTHS_IN_PERIOD: Record<Granularity, number> = { month: 1, halfYear: 6, year: 12 };

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
const compactAmount = (n: number) => (n >= 1000 ? Math.round(n / 1000) + "k" : String(n));

// The figures written over the bars, at three levels of detail:
//   0 — the agreed rule: exact under ten thousand (8,450), thousands above (12.5k)
//   1 — thousands from one thousand up (8.5k, 12.5k)
//   2 — whole thousands (8k, 13k, 125k)
// A chart uses the most detailed level at which every one of its labels fits
// over its bar, so a half-year always reads exactly and only a year squeezed
// onto a phone, twelve bars at ~17px each, gets shortened. The whole chart
// takes one level so neighbouring bars never mix "9,870" with "13k".
// An empty month gets no label rather than a "0".
type LabelDetail = 0 | 1 | 2;
const LABEL_FONT_SIZE = 10.5;

function formatBarLabel(n: number, detail: LabelDetail): string {
  if (!n) return "";
  if (n < (detail === 0 ? 10000 : 1000)) return Math.round(n).toLocaleString("en-US");
  const k = n / 1000;
  return (detail === 2 || k >= 100 ? String(Math.round(k)) : String(Math.round(k * 10) / 10)) + "k";
}

let measureContext: CanvasRenderingContext2D | null = null;
function labelWidth(text: string): number {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext) return text.length * 6;
  measureContext.font = `${LABEL_FONT_SIZE}px ${getComputedStyle(document.body).fontFamily}`;
  return measureContext.measureText(text).width;
}

// Recharts' default category gap leaves each bar 80% of its slot; the
// label may use the whole slot less a little air on either side.
function fittingDetail(values: number[], barWidth: number): LabelDetail {
  const room = barWidth / 0.8 - 3;
  for (const detail of [0, 1] as const) {
    if (values.every((v) => labelWidth(formatBarLabel(v, detail)) <= room)) return detail;
  }
  return 2;
}

const barLabelProps = { position: "top" as const, fontSize: LABEL_FONT_SIZE, fill: "#4A4458" };
// Label entries on a bar chart are cartesian and carry the bar's box.
const barWidth = (entry: object) => ("width" in entry ? Number(entry.width) : 0);

function TrendChart({ period, lang, t }: { period: Period; lang: Language; t: <K extends { th: string; en: string }>(entry: K) => string }) {
  const { data, categories, loading } = useMonthlyCategoryTrend(period, lang);
  const [selected, setSelected] = useState<string | null>(null);

  if (period.granularity === "month" || loading) return null;
  // A category that came to nothing in a month is left out of its row —
  // whether it had no entries or only ฿0 ones, like a paused subscription —
  // so the tooltip, which skips missing values, lists only real spending.
  const chartData = data.map((d) => ({
    month: d.month,
    ...Object.fromEntries(Object.entries(d.byCategory).filter(([, amount]) => amount !== 0)),
    total: Object.values(d.byCategory).reduce((a, b) => a + b, 0),
  }));
  // The month's total is written over the highest segment that has a value.
  // It can't simply ride on the last category's bar: a month where that
  // category is zero draws no bar there, and the label would go with it.
  // Worked out from the month's own row, not its index — a bar with empty
  // months numbers its labels by position among the months it does draw.
  type Row = (typeof chartData)[number];
  const topCategory = (row: Row) => [...categories].reverse().find((cat) => Number(row[cat as keyof Row]) > 0);
  const labelled = chartData.map((row) => (selected === null ? row.total : Number(row[selected as keyof Row]) || 0));
  const labelFor = (value: number, barWidth: number) => formatBarLabel(value, fittingDetail(labelled, barWidth));
  const trendTitle = period.granularity === "halfYear" ? t(TR.reports.trendHalfYear) : t(TR.reports.trendYear);

  return (
    <div className="fp-card" style={{ padding: 26, marginTop: 18 }}>
      <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 8 }}>{trendTitle}</div>
      {categories.length ? (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setSelected(null)} style={toggleStyle(selected === null)}>{t(TR.reports.allCategories)}</button>
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => setSelected(cat)} style={toggleStyle(selected === cat)}>
                {ICON_MAP[cat] || "🏷️"} {translateLabel(cat, lang, CATEGORY_LABEL_EN)}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 18, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} width={36} tickFormatter={compactAmount} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              {selected === null
                ? categories.map((cat, i) => (
                    <Bar key={cat} dataKey={cat} name={translateLabel(cat, lang, CATEGORY_LABEL_EN)} stackId="a" fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]}>
                      {/* One figure per month, not one per colour. */}
                      <LabelList
                        {...barLabelProps}
                        valueAccessor={(entry) => (topCategory(entry.payload) === cat ? labelFor(entry.payload.total, barWidth(entry)) : "")}
                      />
                    </Bar>
                  ))
                : (
                  <Bar dataKey={selected} name={translateLabel(selected, lang, CATEGORY_LABEL_EN)} fill="#7FD1C9" radius={[6, 6, 0, 0]}>
                    <LabelList
                      {...barLabelProps}
                      valueAccessor={(entry) => labelFor(Number(entry.payload[selected]) || 0, barWidth(entry))}
                    />
                  </Bar>
                )}
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <EmptyState text={t(TR.reports.noExpensesThisPeriod)} />
      )}
    </div>
  );
}

export function ExpenseTrendsView() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [period, setPeriod] = useState<Period>(() => defaultPeriod("month"));
  const { total, fixedTotal, variableTotal, investTotal, byCategory, loading } = useExpensePeriod(period);
  const { map: budgetMap } = useBudgets();
  const { lang, t } = useLanguage();

  const changeGranularity = (g: Granularity) => { setGranularity(g); setPeriod(defaultPeriod(g)); };

  if (loading) return null;

  const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
    { value: "month", label: t(TR.assets.granMonth) }, { value: "halfYear", label: t(TR.assets.granHalfYear) }, { value: "year", label: t(TR.assets.granYear) },
  ];

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
      <SectionHeader title={t(TR.reports.title)} sub={t(TR.reports.subtitle)} />

      <div style={{ marginBottom: 18, maxWidth: 320 }}>
        <SegmentedControl options={GRANULARITY_OPTIONS} value={granularity} onChange={changeGranularity} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 18 }}>
        <button type="button" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} style={navButtonStyle} aria-label={t(TR.reports.prevPeriod)}>‹</button>
        <div className="fp-display" style={{ fontSize: 17, fontWeight: 700, color: "#6B5490", minWidth: 160, textAlign: "center" }}>
          {periodLabel(period, lang)}
        </div>
        <button type="button" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} style={navButtonStyle} aria-label={t(TR.reports.nextPeriod)}>›</button>
      </div>

      <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 8 }}>{t(TR.reports.overview)}</div>
        <StatRow label={t(TR.reports.total)} value={fmt(total)} big />
        <StatRow label={t(TR.reports.fixedLabel)} value={fmt(fixedTotal)} />
        <StatRow label={t(TR.reports.generalLabel)} value={fmt(variableTotal)} />
        <StatRow label={t(TR.reports.investLabel)} value={fmt(investTotal)} />
      </div>

      <div className="fp-card" style={{ padding: 26 }}>
        <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 8 }}>{t(TR.reports.byCategory)}</div>
        {byCategory.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={byCategory} dataKey="amount" nameKey="category" innerRadius={40} outerRadius={72} paddingAngle={4} cornerRadius={6}>
                  {byCategory.map((c, i) => <Cell key={c.category} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v, n) => [fmt(Number(v)), translateLabel(String(n), lang, CATEGORY_LABEL_EN)]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, minWidth: 220, fontSize: 13 }}>
              {byCategory.map((c, i) => (
                <div key={c.category} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], flexShrink: 0 }} />
                    <span>{ICON_MAP[c.category] || "🏷️"}</span>
                    <span style={{ color: "var(--ink)" }}>{translateLabel(c.category, lang, CATEGORY_LABEL_EN)}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>({c.count} {t(TR.reports.itemsCount)})</span>
                    <span className="fp-num" style={{ marginLeft: "auto", fontWeight: 600 }}>{fmt(c.amount)}</span>
                    <span className="fp-num" style={{ width: 40, textAlign: "right", color: "var(--ink-soft)" }}>
                      {total > 0 ? ((c.amount / total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <BudgetBar spent={c.amount} budget={(budgetMap.get(c.category) || 0) * MONTHS_IN_PERIOD[period.granularity]} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState text={t(TR.reports.noExpensesThisPeriod)} />
        )}
      </div>

      <TrendChart period={period} lang={lang} t={t} />
    </div>
  );
}
