"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { inRange } from "@/lib/calc";
import { useCycleRange } from "./useMetrics";
import type { CashFlowEntry, PaymentMethod } from "@/lib/types";

export interface PaymentGroup {
  method: PaymentMethod;
  items: CashFlowEntry[];
}

// Cycle-scoped expense totals grouped by payment method (cash/cards), for
// the "สรุปการจ่ายต่อช่องทาง" summary — used by both the cashflow tab's
// nav button and the dedicated summary page it links to.
export function usePaymentGroups() {
  const cycleRange = useCycleRange();
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray(), [], []);
  const loading = cashflow === undefined || paymentMethods === undefined;

  const paymentMethodsSorted = [...(paymentMethods || [])].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "เงินสด" ? -1 : 1));
  const cycleExpenses = (cashflow || []).filter((c) => c.type === "Expense" && inRange(c.date, cycleRange));
  const paymentGroups: PaymentGroup[] = paymentMethodsSorted
    .map((m) => ({ method: m, items: cycleExpenses.filter((c) => c.payment_method_id === m.id) }))
    .filter((g) => g.items.length > 0);

  return { paymentGroups, paymentMethodsSorted, cycleRange, loading };
}
