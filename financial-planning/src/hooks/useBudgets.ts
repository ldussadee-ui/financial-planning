"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Budget } from "@/lib/types";

export function useBudgets() {
  const budgets = useLiveQuery(() => db.budgets.toArray(), [], [] as Budget[]);
  const map = new Map(budgets.map((b) => [b.category, b.amount]));
  const setBudget = (category: string, amount: number) => {
    if (amount > 0) void db.budgets.put({ category, amount });
    else void db.budgets.delete(category);
  };
  return { budgets, map, setBudget };
}
