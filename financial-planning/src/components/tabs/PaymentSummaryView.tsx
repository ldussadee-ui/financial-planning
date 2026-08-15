"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, fmtRange } from "@/lib/calc";
import { usePaymentGroups } from "@/hooks/usePaymentGroups";
import { SectionHeader, Group, EmptyState } from "@/components/ui";
import { renderByDay } from "./cashflowShared";

export function PaymentSummaryView() {
  const { paymentGroups, cycleRange, loading } = usePaymentGroups();
  const remove = (id: string) => void db.cashflow.delete(id);

  if (loading) return null;

  const total = paymentGroups.reduce((s, g) => s + g.items.reduce((s2, c) => s2 + c.amount, 0), 0);

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
      <SectionHeader
        title="สรุปการจ่ายต่อช่องทาง 💳"
        sub={`เงินสดและบัตรเครดิตที่ใช้จ่ายในรอบปัจจุบัน · ${fmtRange(cycleRange)} · รวม ${fmt(total)}`}
      />

      {paymentGroups.length ? (
        paymentGroups.map(({ method, items }) => (
          <Group
            key={method.id}
            title={`${method.kind === "เงินสด" ? "💵" : "💳"} ${method.name} — ${fmt(items.reduce((s, c) => s + c.amount, 0))}`}
            tint="#F5F0FF"
          >
            {renderByDay(items, remove)}
          </Group>
        ))
      ) : (
        <div className="fp-card" style={{ padding: 10 }}>
          <EmptyState text="ยังไม่มีรายจ่ายที่ระบุช่องทางในรอบนี้" />
        </div>
      )}
    </div>
  );
}
