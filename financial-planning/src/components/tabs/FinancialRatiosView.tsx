"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFinancialRatios } from "@/hooks/useFinancialRatios";
import { SectionHeader } from "@/components/ui";
import { getRatioAdvice, type FinancialRatio, type RatioStatus } from "@/lib/financialRatios";

function formatValue(r: FinancialRatio) {
  if (r.value === null) return "—";
  return r.unit === "x" ? r.value.toFixed(2) + " เท่า" : r.value.toFixed(1) + "%";
}

function statusBadge(status: RatioStatus) {
  if (status === "pass") return { text: "✓ ผ่าน", bg: "#E1F5EE", color: "#0F6E56" };
  if (status === "fail") return { text: "✕ ไม่ผ่าน", bg: "#FCEBEB", color: "#A32D2D" };
  return { text: "– ไม่มีข้อมูล", bg: "#F5F3EE", color: "var(--ink-soft)" };
}

export function FinancialRatiosView() {
  const { ratios, passCount, total, loading } = useFinancialRatios();

  if (loading) return null;

  return (
    <div>
      <Link
        href="/dashboard"
        aria-label="กลับไปภาพรวม"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%",
          background: "#F5EFFF", color: "#7A5C9E", marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} />
      </Link>
      <SectionHeader title="อัตราส่วนทางการเงิน 📐" sub={`ผ่านเกณฑ์มาตรฐาน ${passCount} จาก ${total} ข้อ — คำนวณจากข้อมูลรอบบัญชีปัจจุบัน`} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ratios.map((r) => {
          const badge = statusBadge(r.status);
          const advice = getRatioAdvice(r);
          return (
            <div key={r.key} className="fp-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{r.formulaLabel}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                  {badge.text}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5, color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 4 }}>
                <span>มาตรฐาน {r.standardLabel}</span>
                <span className="fp-num" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{formatValue(r)}</span>
              </div>
              {advice && (
                <div style={{ fontSize: 12, color: "#A32D2D", background: "#FCEBEB", borderRadius: 10, padding: "8px 10px", marginTop: 8 }}>
                  💡 {advice}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
