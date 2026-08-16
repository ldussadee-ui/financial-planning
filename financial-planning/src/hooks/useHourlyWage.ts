"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { inRange } from "@/lib/calc";
import { IRREGULAR_INCOME_KEYWORDS } from "@/lib/constants";
import { useCycleRange } from "./useMetrics";
import { useSetting } from "./useSetting";
import type { CashFlowEntry } from "@/lib/types";

const HOURS_PER_MONTH = 160;

const isIrregularIncome = (category: string) => {
  const t = (category || "").toLowerCase();
  return IRREGULAR_INCOME_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
};

// The hourly wage used for the "hours of work" spend comparison.
// - Auto mode (default): always live — this cycle's Active income, excluding
//   one-off items like bonuses/incentives/commissions (would skew a wage
//   estimate), ÷ 160 hrs/month. Updates itself every time income changes,
//   so raises don't need a manual edit.
// - Manual mode: the user's own saved number. The auto figure is still
//   surfaced as `computedWage` so Settings can offer a one-tap "use this"
//   sync without silently overwriting a deliberate custom value.
export function useHourlyWage(): {
  hourlyWage: number;
  autoWage: boolean;
  setAutoWage: (v: boolean) => void;
  manualWage: number;
  setManualWage: (v: number) => void;
  computedWage: number;
} {
  const cycleRange = useCycleRange();
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], [] as CashFlowEntry[]);
  const [autoWage, setAutoWage] = useSetting<boolean>("autoWage", true);
  const [manualWage, setManualWage] = useSetting<number>("hourlyWage", 0);

  const activeIncomeThisCycle = cashflow
    .filter((c) => c.type === "Income" && c.incomeClass === "Active" && !isIrregularIncome(c.category) && inRange(c.date, cycleRange))
    .reduce((s, c) => s + Number(c.amount || 0), 0);
  const computedWage = activeIncomeThisCycle > 0 ? Math.round(activeIncomeThisCycle / HOURS_PER_MONTH) : 0;

  const hourlyWage = autoWage ? computedWage : manualWage;

  return { hourlyWage, autoWage, setAutoWage, manualWage, setManualWage, computedWage };
}
