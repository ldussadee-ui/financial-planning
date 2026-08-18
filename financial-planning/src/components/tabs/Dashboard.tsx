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
import { SectionHeader, StatRow, EmptyState, BudgetBar } from "@/components/ui";

const BUDGET_ALERT_THRESHOLD = 80;

// A StatRow that expands in place to list the individual items behind the
// total — read-only (editing still happens in the dedicated asset tabs), so
// the dashboard stays a quick overview rather than growing its own CRUD UI.
function ExpandableStatRow({
  label, value, expanded, onToggle, items,
}: {
  label: string;
  value: string;
  expanded: boolean;
  onToggle: () => void;
  items: { name: string; value: string }[];
}) {
  return (
    <div>
      <div
        onClick={onToggle}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", cursor: "pointer" }}
      >
        <span style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {label}
        </span>
        <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 19, paddingBottom: 6 }}>
          {items.length ? items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", padding: "4px 0" }}>
              <span>{it.name}</span>
              <span className="fp-num">{it.value}</span>
            </div>
          )) : <div style={{ fontSize: 12, color: "var(--ink-soft)", padding: "4px 0" }}>ยังไม่มีรายการ</div>}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { metrics, cycleRange, loading } = useMetrics();
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const personal = useLiveQuery(() => db.personalAssets.toArray(), [], []);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const { map: budgetMap } = useBudgets();
  const { passCount: ratioPassCount, total: ratioTotal, loading: ratiosLoading } = useFinancialRatios();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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

  return (
    <div>
      <SectionHeader title="ภาพรวมการเงิน ☺️" sub={`สรุปสถานะสินทรัพย์ หนี้สิน และกระแสเงินสด · รอบปัจจุบัน ${fmtRange(cycleRange)}`} chip="ทดลองใช้งาน" />

      <div className="fp-card" style={{ padding: 26 }}>
        <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 8 }}>💗 มูลค่าสุทธิ</div>
        <ExpandableStatRow
          label="สินทรัพย์สภาพคล่อง"
          value={fmt(metrics.totalLiquid)}
          expanded={expanded.has("liquid")}
          onToggle={() => toggle("liquid")}
          items={(liquid || []).map((a) => ({ name: a.name, value: fmt(a.current_value) }))}
        />
        <ExpandableStatRow
          label="สินทรัพย์เพื่อการลงทุน"
          value={fmt(metrics.totalInvestment)}
          expanded={expanded.has("investment")}
          onToggle={() => toggle("investment")}
          items={(investment || []).map((a) => ({ name: a.name, value: fmt(a.current_value) }))}
        />
        <ExpandableStatRow
          label="สินทรัพย์ส่วนตัว (ไม่ก่อรายได้)"
          value={fmt(metrics.totalPersonal)}
          expanded={expanded.has("personal")}
          onToggle={() => toggle("personal")}
          items={(personal || []).map((a) => ({ name: a.name, value: fmt(a.current_value) }))}
        />
        <ExpandableStatRow
          label="หนี้สินรวม"
          value={"− " + fmt(metrics.totalLiab)}
          expanded={expanded.has("liability")}
          onToggle={() => toggle("liability")}
          items={(liabilities || []).map((l) => ({ name: l.type, value: fmt(l.balance) }))}
        />
        <div style={{ borderTop: "2px dashed var(--line)", marginTop: 8, paddingTop: 10 }}>
          <StatRow label="Net Worth รวมทั้งหมด" value={fmt(metrics.totalNetWorth)} big />
          <StatRow label="Investable Net Worth" value={fmt(metrics.investableNetWorth)} big />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
          * Investable Net Worth = สินทรัพย์สภาพคล่อง + สินทรัพย์ลงทุน − หนี้สินรวม
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <div className="fp-card" style={{ padding: 26, marginTop: 18 }}>
          <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600, marginBottom: 16 }}>🎯 งบประมาณ</div>
          {budgetAlerts.map((b) => (
            <div key={b.category} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, marginBottom: 6 }}>
                <span>{ICON_MAP[b.category] || "🏷️"}</span>
                <span>{b.category}</span>
              </div>
              <BudgetBar spent={b.spent} budget={b.budget} />
            </div>
          ))}
        </div>
      )}

      <div className="fp-card" style={{ padding: 26, marginTop: 18 }}>
        <div
          onClick={() => toggle("allocation")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <span style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600 }}>🥧 สัดส่วนสินทรัพย์เพื่อการลงทุน</span>
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
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, fontSize: 12.5 }}>
                {metrics.byCat.map((c) => (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: c.color, display: "inline-block" }} />
                    <span style={{ color: "var(--ink-soft)" }}>{c.name}</span>
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
                    <span style={{ color: "var(--ink-soft)" }}>สัดส่วนมากสุด: {topCat.name}</span>
                    <span className="fp-num" style={{ marginLeft: "auto", fontWeight: 600 }}>
                      {((topCat.value / metrics.totalInvestment) * 100).toFixed(0)}%
                    </span>
                  </>
                );
              })()}
            </div>
          )
        ) : <EmptyState text="ยังไม่มีสินทรัพย์เพื่อการลงทุน" />}
      </div>

      {!ratiosLoading && (
        <Link
          href="/dashboard/financial-ratios"
          className="fp-card"
          style={{ padding: 26, marginTop: 18, display: "block", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600 }}>📐 อัตราส่วนทางการเงิน</div>
            <span style={{ fontSize: 12, color: "#7A5C9E", fontWeight: 600 }}>ดูรายละเอียด →</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="fp-display" style={{ fontSize: 26, fontWeight: 700, color: "#0F6E56" }}>{ratioPassCount}</span>
            <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>จาก {ratioTotal} ข้อ ผ่านเกณฑ์มาตรฐาน</span>
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
            <div style={{ flex: ratioPassCount, height: 6, borderRadius: 999, background: "#0F6E56" }} />
            <div style={{ flex: ratioTotal - ratioPassCount, height: 6, borderRadius: 999, background: "#FF8C7A" }} />
          </div>
        </Link>
      )}

      <div style={{ marginTop: 18 }}>
        <div className="fp-card" style={{ padding: 26 }}>
          <div
            onClick={() => toggle("passive")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <span style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600 }}>🌿 รายรับ Passive</span>
            {expanded.has("passive") ? <ChevronDown size={16} color="var(--ink-soft)" /> : <ChevronRight size={16} color="var(--ink-soft)" />}
          </div>
          <div className="fp-display" style={{ fontSize: 32, fontWeight: 700, color: "#0F6E56", marginTop: 8 }}>
            {metrics.passiveRatio === null ? "—" : (metrics.passiveRatio * 100).toFixed(1) + "%"}
          </div>
          {expanded.has("passive") && (
            <>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3, marginBottom: 6 }}>ของรายจ่ายรวมในรอบนี้ มาจาก Passive Income</div>
              <StatRow label="รายได้ Active" value={fmt(metrics.incomeActive)} />
              <StatRow label="รายได้ Passive" value={fmt(metrics.incomePassive)} />
              <StatRow label="รายจ่ายประจำ (คงที่)" value={fmt(metrics.expenseFixed)} />
              <StatRow label="รายจ่ายทั่วไป" value={fmt(metrics.expenseVariable)} />
              <StatRow label="รายจ่ายออมและลงทุน" value={fmt(metrics.expenseInvest)} />
              <StatRow label="เงินคงเหลือในรอบนี้" value={fmt(metrics.savings)} big />
            </>
          )}
        </div>
      </div>

      <div className="fp-card" style={{ padding: 26, marginTop: 18 }}>
        <div
          onClick={() => toggle("goals")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <span style={{ fontSize: 13, color: "#8B7FA0", fontWeight: 600 }}>🎯 ความคืบหน้าเป้าหมาย</span>
          {expanded.has("goals") ? <ChevronDown size={16} color="var(--ink-soft)" /> : <ChevronRight size={16} color="var(--ink-soft)" />}
        </div>
        {goalProgress.length ? (
          expanded.has("goals") ? (
            <div style={{ marginTop: 16 }}>
              {goalProgress.map(({ goal: g, linked, pct }) => (
                <div key={g.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 6 }}>
                    <span>{g.name} <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>({g.type})</span></span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span className="fp-num">{fmt(linked)} / {fmt(g.target)}</span>
                      <span className="fp-num" style={{ fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div style={{ height: 10, background: "#FBF2FF", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: "#D4577E", borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 10 }}>
              {goalProgress.length} เป้าหมาย · เฉลี่ยคืบหน้า {avgGoalPct.toFixed(0)}%
            </div>
          )
        ) : <EmptyState text="ยังไม่มีเป้าหมาย" />}
      </div>
    </div>
  );
}
