"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { periodContains, type Period } from "@/lib/period";
import type { ExpenseClass } from "@/lib/types";

export interface CategoryTotal {
  category: string;
  amount: number;
  count: number;
  expenseClass: ExpenseClass;
}

// What did I spend in this period, broken down by Fixed/Variable and by
// category — a drill-into-one-period view, not a multi-period trend.
export function useExpensePeriod(period: Period) {
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], []);
  const loading = cashflow === undefined;
  const entries = (cashflow || []).filter((c) => c.type === "Expense" && periodContains(period, c.date));

  const fixedTotal = entries.filter((e) => e.expense_class === "Fixed").reduce((s, e) => s + Number(e.amount || 0), 0);
  const investTotal = entries.filter((e) => e.expense_class === "Invest").reduce((s, e) => s + Number(e.amount || 0), 0);
  const variableTotal = entries.filter((e) => e.expense_class !== "Fixed" && e.expense_class !== "Invest").reduce((s, e) => s + Number(e.amount || 0), 0);
  const total = fixedTotal + variableTotal + investTotal;

  const byCategoryMap = new Map<string, CategoryTotal>();
  for (const e of entries) {
    const expenseClass: ExpenseClass = e.expense_class === "Fixed" ? "Fixed" : e.expense_class === "Invest" ? "Invest" : "Variable";
    const existing = byCategoryMap.get(e.category);
    if (existing) {
      existing.amount += Number(e.amount || 0);
      existing.count += 1;
    } else {
      byCategoryMap.set(e.category, { category: e.category, amount: Number(e.amount || 0), count: 1, expenseClass });
    }
  }
  const byCategory = Array.from(byCategoryMap.values()).sort((a, b) => b.amount - a.amount);

  return { total, fixedTotal, variableTotal, investTotal, byCategory, loading };
}
