"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { inRange, type CycleRange } from "@/lib/calc";
import type { CashFlowEntry, PaymentMethod } from "@/lib/types";

export interface PaymentGroup {
  method: PaymentMethod;
  items: CashFlowEntry[];
}

// Expenses within one cycle, grouped by the payment method they were paid
// with (cash first, then cards), for the "สรุปการจ่ายต่อช่องทาง" page. The
// cycle is passed in rather than read here, so the page can step back
// through earlier cycles with the same stepper the cashflow tab uses.
export function usePaymentGroups(cycleRange: CycleRange) {
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray(), [], []);
  const loading = cashflow === undefined || paymentMethods === undefined;

  const paymentMethodsSorted = [...(paymentMethods || [])].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "เงินสด" ? -1 : 1));
  const cycleExpenses = (cashflow || []).filter((c) => c.type === "Expense" && inRange(c.date, cycleRange));
  const paymentGroups: PaymentGroup[] = paymentMethodsSorted
    .map((m) => ({ method: m, items: cycleExpenses.filter((c) => c.payment_method_id === m.id) }))
    .filter((g) => g.items.length > 0);

  return { paymentGroups, paymentMethodsSorted, loading };
}
