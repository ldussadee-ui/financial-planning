"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { db } from "@/lib/db";
import { categoryBudgetStatus, fmt, fmtRange, inRange } from "@/lib/calc";
import { ICON_MAP } from "@/lib/constants";
import { useMetrics } from "@/hooks/useMetrics";
import { useBudgets } from "@/hooks/useBudgets";
import { useFinancialRatios } from "@/hooks/useFinancialRatios";
import { useInsuranceAnalysis } from "@/hooks/useInsuranceAnalysis";
import { useNetWorthTrend } from "@/hooks/useNetWorthTrend";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, type Language, CATEGORY_LABEL_EN, GOAL_TYPE_LABEL_EN, INVESTMENT_CAT_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, StatRow, EmptyState, BudgetBar } from "@/components/ui";

const BUDGET_ALERT_THRESHOLD = 80;

// The page's headline: net worth on a yellow block, with how it moved since
// last month and a sparkline of the last several months. Both come from the
// daily net-worth snapshots, so a new install shows just the number until
// there is a second month to compare against.
function NetWorthHero({
  netWorth, investable, label, investableLabel, vsLastMonth, lang,
}: {
  netWorth: number; investable: number; label: string; investableLabel: string; vsLastMonth: string; lang: Language;
}) {
  const { points } = useNetWorthTrend("month", 8, lang);
  const values = points.map((p) => p.netWorth).filter((v): v is number => v !== null);
  const pct = points.length ? points[points.length - 1].pct : null;
  let path = "";
  if (values.length >= 2) {
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    path = values
      .map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 300).toFixed(1)} ${(34 - ((v - min) / span) * 30).toFixed(1)}`)
      .join(" ");
  }
  return (
    <div className="fp-card" style={{ background: "var(--yellow)", padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div className="fp-num" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.15, marginTop: 2 }}>{fmt(netWorth)}</div>
      {pct !== null && (
        <span
          className="fp-num"
          style={{
            display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
            background: "var(--ink)", color: pct >= 0 ? "var(--yellow)" : "var(--rose)",
          }}
        >
          {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% {vsLastMonth}
        </span>
      )}
      {path && (
        <svg viewBox="0 0 300 38" preserveAspectRatio="none" aria-hidden style={{ display: "block", width: "100%", height: 40, marginTop: 8 }}>
          <path d={`${path} L300 38 L0 38 Z`} fill="rgba(22,19,31,0.08)" />
          <path d={path} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, marginTop: 8, paddingTop: 8, borderTop: "2px solid var(--border)" }}>
        <span>{investableLabel}</span>
        <span className="fp-num" style={{ fontWeight: 600 }}>{fmt(investable)}</span>
      </div>
    </div>
  );
}

// A pass/total score that opens its detail page: one segment per criterion,
// so how many passed reads at a glance even at half width.
function ScoreCard({ href, title, pass, total, passedLabel }: { href: string; title: string; pass: number; total: number; passedLabel: string }) {
  return (
    <Link href={href} className="fp-card fp-pop" style={{ padding: "14px 14px 16px", display: "block", color: "inherit", minWidth: 0, boxShadow: "var(--shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{title}</h2>
        <ChevronRight size={16} style={{ flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
        <span className="fp-num" style={{ fontSize: 28, fontWeight: 600, color: "#0A8A55", lineHeight: 1 }}>{pass}</span>
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>/ {total} {passedLabel}</span>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} style={{ flex: 1, height: 8, borderRadius: 999, border: "1.5px solid var(--border)", background: i < pass ? "var(--teal)" : "var(--pink)" }} />
        ))}
      </div>
    </Link>
  );
}

export function Dashboard() {
  const { lang, t } = useLanguage();
  const { metrics, cycleRange, loading } = useMetrics();
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const personal = useLiveQuery(() => db.personalAssets.toArray(), [], []);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const { map: budgetMap } = useBudgets();
  const { passCount: ratioPassCount, total: ratioTotal, loading: ratiosLoading } = useFinancialRatios(lang);
  const { passCount: insurancePassCount, total: insuranceTotal, loading: insuranceLoading } = useInsuranceAnalysis(lang);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openTile, setOpenTile] = useState<string | null>(null);
  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  if (loading) return null;

  const cycleCF = (cashflow || []).filter((c) => inRange(c.date, cycleRange));
  // Only Variable spend is worth an overspend alert here — Fixed costs
  // can't be adjusted mid-cycle, and going over an Invest "budget" is good
  // news, not a warning.
  const variableCF = cycleCF.filter((c) => c.expense_class !== "Fixed" && c.expense_class !== "Invest");
  const budgetAlerts = categoryBudgetStatus(variableCF, budgetMap).filter((b) => b.pct >= BUDGET_ALERT_THRESHOLD);

  const goalProgress = (goals || []).map((g) => {
    const linked =
      (investment || []).filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0) +
      (liquid || []).filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0);
    return { goal: g, linked, pct: Math.min(100, (linked / g.target) * 100) };
  });
  const avgGoalPct = goalProgress.length ? goalProgress.reduce((s, g) => s + g.pct, 0) / goalProgress.length : 0;

  const tiles = [
    { key: "liquid", label: t(TR.dashboard.tileLiquid), fullLabel: t(TR.dashboard.liquidAssets), color: "var(--mint)", value: fmt(metrics.totalLiquid),
      items: (liquid || []).map((a) => ({ name: a.name, value: fmt(a.current_value) })) },
    { key: "investment", label: t(TR.dashboard.tileInvestment), fullLabel: t(TR.dashboard.investmentAssets), color: "var(--lav)", value: fmt(metrics.totalInvestment),
      items: (investment || []).map((a) => ({ name: a.name, value: fmt(a.current_value) })) },
    { key: "personal", label: t(TR.dashboard.tilePersonal), fullLabel: t(TR.dashboard.personalAssets), color: "var(--peach)", value: fmt(metrics.totalPersonal),
      items: (personal || []).map((a) => ({ name: a.name, value: fmt(a.current_value) })) },
    { key: "liability", label: t(TR.dashboard.tileLiabilities), fullLabel: t(TR.dashboard.totalLiabilities), color: "var(--rose)", value: "− " + fmt(metrics.totalLiab),
      items: (liabilities || []).map((l) => ({ name: l.type, value: fmt(l.balance) })) },
  ];
  const openTileData = tiles.find((tile) => tile.key === openTile);

  return (
    <div>
      <SectionHeader title={t(TR.dashboard.title)} sub={`${t(TR.dashboard.subtitle)} ${fmtRange(cycleRange, lang)}`} chip={t(TR.dashboard.trialChip)} />

      <NetWorthHero
        netWorth={metrics.totalNetWorth}
        investable={metrics.investableNetWorth}
        investableLabel={t(TR.dashboard.investableNetWorth)}
        label={t(TR.dashboard.netWorthSection)}
        vsLastMonth={t(TR.dashboard.vsLastMonth)}
        lang={lang}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => setOpenTile(openTile === tile.key ? null : tile.key)}
            aria-expanded={openTile === tile.key}
            title={tile.fullLabel}
            className="fp-card"
            style={{
              background: tile.color, padding: "12px 14px", textAlign: "left", cursor: "pointer",
              color: "var(--ink)", minWidth: 0,
              boxShadow: openTile === tile.key ? "none" : undefined,
              transform: openTile === tile.key ? "translate(3px, 3px)" : undefined,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, fontWeight: 500 }}>
              {tile.label}
              {openTile === tile.key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="fp-num" style={{ display: "block", fontSize: 18, fontWeight: 600, marginTop: 2 }}>{tile.value}</span>
          </button>
        ))}
      </div>
      {openTileData && (
        <div className="fp-card" style={{ padding: "12px 16px", marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{openTileData.fullLabel}</div>
          {openTileData.items.length ? openTileData.items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "5px 0", borderTop: i ? "1px solid var(--line)" : undefined }}>
              <span style={{ minWidth: 0 }}>{it.name}</span>
              <span className="fp-num" style={{ fontWeight: 500 }}>{it.value}</span>
            </div>
          )) : <div style={{ fontSize: 13, color: "var(--ink-soft)", padding: "4px 0" }}>{t(TR.dashboard.noItems)}</div>}
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
        {t(TR.dashboard.investableNote)}
      </div>

      {budgetAlerts.length > 0 && (
        <div className="fp-card" style={{ padding: 20, marginTop: 18 }}>
          <h2 style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600, marginBottom: 16 }}>{t(TR.dashboard.budgetAlert)}</h2>
          {budgetAlerts.map((b) => (
            <div key={b.category} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, marginBottom: 6 }}>
                <span>{ICON_MAP[b.category] || "🏷️"}</span>
                <span>{translateLabel(b.category, lang, CATEGORY_LABEL_EN)}</span>
              </div>
              <BudgetBar spent={b.spent} budget={b.budget} />
            </div>
          ))}
        </div>
      )}

      <div className="fp-card" style={{ padding: 20, marginTop: 18 }}>
        <div
          onClick={() => toggle("allocation")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <h2 style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{t(TR.dashboard.allocation)}</h2>
          {expanded.has("allocation") ? <ChevronDown size={16} color="var(--ink-soft)" /> : <ChevronRight size={16} color="var(--ink-soft)" />}
        </div>
        {metrics.byCat.length ? (
          expanded.has("allocation") ? (
            <div style={{ height: 190, display: "flex", alignItems: "center", marginTop: 10 }}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={metrics.byCat} dataKey="value" nameKey="name" innerRadius={40} outerRadius={72} paddingAngle={4} cornerRadius={6}>
                    {metrics.byCat.map((c) => <Cell key={c.key} fill={c.color} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [fmt(Number(v)), translateLabel(String(n), lang, INVESTMENT_CAT_LABEL_EN)]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, fontSize: 12.5 }}>
                {metrics.byCat.map((c) => (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: c.color, display: "inline-block" }} />
                    <span style={{ color: "var(--ink-soft)" }}>{translateLabel(c.name, lang, INVESTMENT_CAT_LABEL_EN)}</span>
                    <span className="fp-num" style={{ marginLeft: "auto", fontWeight: 600 }}>
                      {((c.value / metrics.totalInvestment) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, fontSize: 13 }}>
              {(() => {
                const topCat = [...metrics.byCat].sort((a, b) => b.value - a.value)[0];
                return (
                  <>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: topCat.color, display: "inline-block" }} />
                    <span style={{ color: "var(--ink-soft)" }}>{t(TR.dashboard.topAllocation)} {translateLabel(topCat.name, lang, INVESTMENT_CAT_LABEL_EN)}</span>
                    <span className="fp-num" style={{ marginLeft: "auto", fontWeight: 600 }}>
                      {((topCat.value / metrics.totalInvestment) * 100).toFixed(0)}%
                    </span>
                  </>
                );
              })()}
            </div>
          )
        ) : <EmptyState text={t(TR.dashboard.noInvestmentAssets)} />}
      </div>

      {(!ratiosLoading || !insuranceLoading) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
          {!ratiosLoading && (
            <ScoreCard href="/dashboard/financial-ratios" title={t(TR.dashboard.financialRatios)} pass={ratioPassCount} total={ratioTotal} passedLabel={t(TR.dashboard.ratiosPassedShort)} />
          )}
          {!insuranceLoading && (
            <ScoreCard href="/dashboard/insurance" title={t(TR.dashboard.riskProtection)} pass={insurancePassCount} total={insuranceTotal} passedLabel={t(TR.dashboard.ratiosPassedShort)} />
          )}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <div className="fp-card" style={{ padding: 20 }}>
          <div
            onClick={() => toggle("passive")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <h2 style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{t(TR.dashboard.passiveIncome)}</h2>
            {expanded.has("passive") ? <ChevronDown size={16} color="var(--ink-soft)" /> : <ChevronRight size={16} color="var(--ink-soft)" />}
          </div>
          <div className="fp-display" style={{ fontSize: 32, fontWeight: 600, color: "#0A8A55", marginTop: 4 }}>
            {metrics.passiveRatio === null ? "—" : (metrics.passiveRatio * 100).toFixed(1) + "%"}
          </div>
          {expanded.has("passive") && (
            <>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3, marginBottom: 6 }}>{t(TR.dashboard.passiveIncomeNote)}</div>
              <StatRow label={t(TR.dashboard.activeIncome)} value={fmt(metrics.incomeActive)} />
              <StatRow label={t(TR.dashboard.passiveIncomeLabel)} value={fmt(metrics.incomePassive)} />
              <StatRow label={t(TR.dashboard.fixedExpense)} value={fmt(metrics.expenseFixed)} />
              <StatRow label={t(TR.dashboard.generalExpense)} value={fmt(metrics.expenseVariable)} />
              <StatRow label={t(TR.dashboard.investExpense)} value={fmt(metrics.expenseInvest)} />
              <StatRow label={t(TR.dashboard.remainingBalance)} value={fmt(metrics.savings)} big />
            </>
          )}
        </div>
      </div>

      <div className="fp-card" style={{ padding: 20, marginTop: 18 }}>
        <div
          onClick={() => toggle("goals")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <h2 style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600 }}>{t(TR.dashboard.goalProgress)}</h2>
          {expanded.has("goals") ? <ChevronDown size={16} color="var(--ink-soft)" /> : <ChevronRight size={16} color="var(--ink-soft)" />}
        </div>
        {goalProgress.length ? (
          expanded.has("goals") ? (
            <div style={{ marginTop: 16 }}>
              {goalProgress.map(({ goal: g, linked, pct }) => (
                <div key={g.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 6 }}>
                    <span>{g.name} <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>({translateLabel(g.type, lang, GOAL_TYPE_LABEL_EN)})</span></span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span className="fp-num">{fmt(linked)} / {fmt(g.target)}</span>
                      <span className="fp-num" style={{ fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div style={{ height: 10, background: "var(--lilac)", border: "1.5px solid var(--border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: "var(--accent)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 10 }}>
              {goalProgress.length} {t(TR.dashboard.goalsCountSuffix)} · {t(TR.dashboard.avgProgress)} {avgGoalPct.toFixed(0)}%
            </div>
          )
        ) : <EmptyState text={t(TR.dashboard.noGoals)} />}
      </div>
    </div>
  );
}
