"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, fmtRange } from "@/lib/calc";
import { usePaymentGroups } from "@/hooks/usePaymentGroups";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, PAYMENT_METHOD_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, Group, EmptyState } from "@/components/ui";
import { renderByDay } from "./cashflowShared";

export function PaymentSummaryView() {
  const { lang, t } = useLanguage();
  const { paymentGroups, cycleRange, loading } = usePaymentGroups();
  const remove = (id: string) => void db.cashflow.delete(id);

  if (loading) return null;

  const total = paymentGroups.reduce((s, g) => s + g.items.reduce((s2, c) => s2 + c.amount, 0), 0);

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
      <SectionHeader
        title={t(TR.reports.paymentSummaryTitle)}
        sub={`${t(TR.reports.paymentSummarySub)} · ${fmtRange(cycleRange, lang)} · ${t(TR.reports.totalWord)} ${fmt(total)}`}
      />

      {paymentGroups.length ? (
        paymentGroups.map(({ method, items }) => (
          <Group
            key={method.id}
            title={`${method.kind === "เงินสด" ? "💵" : "💳"} ${translateLabel(method.name, lang, PAYMENT_METHOD_LABEL_EN)}`}
            amount={fmt(items.reduce((s, c) => s + c.amount, 0))}
            tint="#F5F0FF"
          >
            {renderByDay(items, remove, undefined, undefined, lang)}
          </Group>
        ))
      ) : (
        <div className="fp-card" style={{ padding: 10 }}>
          <EmptyState text={t(TR.reports.noPaymentEntries)} />
        </div>
      )}
    </div>
  );
}
