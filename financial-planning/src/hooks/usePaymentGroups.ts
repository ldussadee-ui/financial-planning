"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { inRange, type CycleRange } from "@/lib/calc";
import type { CashFlowEntry, PaymentMethodKind } from "@/lib/types";

export interface PaymentGroup {
  key: string;
  /** Method name as stored; empty when the method isn't known. */
  name: string;
  /** null when the entries don't say how they were paid. */
  kind: PaymentMethodKind | null;
  /** Whose entries these are, for ones imported from someone else. */
  owner: string | null;
  items: CashFlowEntry[];
}

const cashFirst = (a: PaymentMethodKind | null, b: PaymentMethodKind | null) =>
  a === b ? 0 : a === "เงินสด" ? -1 : b === "เงินสด" ? 1 : a === null ? 1 : b === null ? -1 : 0;

// Expenses within one cycle, grouped by how they were paid, for the
// "สรุปการจ่ายต่อช่องทาง" page. The cycle is passed in rather than read here,
// so the page can step back through earlier cycles.
//
// Our own expenses group under our payment methods (cash first, then cards),
// and one with no method counts as cash, as the entry form would have saved
// it. Entries imported from someone else carry their payment method only by
// name, so they group by person and method name ("บัตร SCB · แม่"); an
// import that didn't say goes under "no payment method" for that person.
// Nothing is dropped — every expense in the cycle lands in some group.
export function usePaymentGroups(cycleRange: CycleRange) {
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray(), [], []);
  const loading = cashflow === undefined || paymentMethods === undefined;

  const methods = [...(paymentMethods || [])].sort((a, b) => cashFirst(a.kind, b.kind));
  const cash = methods.find((m) => m.kind === "เงินสด");
  const cycleExpenses = (cashflow || []).filter((c) => c.type === "Expense" && inRange(c.date, cycleRange));

  const own: PaymentGroup[] = methods.map((m) => ({ key: m.id, name: m.name, kind: m.kind, owner: null, items: [] }));
  const ownById = new Map(own.map((g) => [g.key, g]));
  const ownUnspecified: PaymentGroup = { key: "own:none", name: "", kind: null, owner: null, items: [] };
  const imported = new Map<string, PaymentGroup>();

  for (const entry of cycleExpenses) {
    if (entry.owner) {
      const name = entry.payment_method_label || "";
      const kind = name ? entry.payment_method_kind ?? null : null;
      const key = `${entry.owner}|${kind ?? ""}|${name}`;
      if (!imported.has(key)) imported.set(key, { key, name, kind, owner: entry.owner, items: [] });
      imported.get(key)!.items.push(entry);
      continue;
    }
    const methodId = entry.payment_method_id || cash?.id;
    const group = methodId ? ownById.get(methodId) : undefined;
    // A method since deleted, or no cash method to default to.
    (group ?? ownUnspecified).items.push(entry);
  }

  const importedSorted = [...imported.values()].sort(
    (a, b) => (a.owner ?? "").localeCompare(b.owner ?? "", "th") || cashFirst(a.kind, b.kind) || a.name.localeCompare(b.name, "th"),
  );
  const paymentGroups = [...own, ownUnspecified, ...importedSorted].filter((g) => g.items.length > 0);

  return { paymentGroups, loading };
}
