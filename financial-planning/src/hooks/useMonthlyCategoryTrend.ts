"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { periodContains, type Period } from "@/lib/period";
import type { CashFlowEntry } from "@/lib/types";

export interface MonthlyCategoryPoint {
  month: string;
  byCategory: Record<string, number>;
}

// Breaks the currently-viewed half-year/year period down into its
// individual months, so the trend chart can compare categories against
// each other across those months. Not meaningful for a single month
// itself — callers should only use this when period.granularity !== "month".
export function useMonthlyCategoryTrend(period: Period) {
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], [] as CashFlowEntry[]);
  const loading = cashflow === undefined;

  const monthIndices =
    period.granularity === "halfYear" ? Array.from({ length: 6 }, (_, i) => period.index * 6 + i)
    : period.granularity === "year" ? Array.from({ length: 12 }, (_, i) => i)
    : [];

  const data: MonthlyCategoryPoint[] = monthIndices.map((index) => {
    const monthPeriod: Period = { granularity: "month", year: period.year, index };
    const label = new Date(period.year, index, 1).toLocaleDateString("th-TH", { month: "short" });
    const byCategory: Record<string, number> = {};
    for (const e of cashflow || []) {
      if (e.type !== "Expense" || !periodContains(monthPeriod, e.date)) continue;
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
    }
    return { month: label, byCategory };
  });

  const totalByCategory = new Map<string, number>();
  for (const point of data) {
    for (const [cat, amount] of Object.entries(point.byCategory)) {
      totalByCategory.set(cat, (totalByCategory.get(cat) || 0) + amount);
    }
  }
  const categories = Array.from(totalByCategory.keys()).sort((a, b) => (totalByCategory.get(b) || 0) - (totalByCategory.get(a) || 0));

  return { data, categories, loading };
}
