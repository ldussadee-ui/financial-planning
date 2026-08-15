"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { CATS } from "@/lib/constants";
import { getCycleRange, inRange, type CycleRange } from "@/lib/calc";
import { useSetting } from "./useSetting";
import type { CashFlowEntry, Goal, InvestmentAsset, LiquidAsset, PersonalAsset, Liability } from "@/lib/types";

export interface ByCatSlice {
  name: string;
  key: string;
  value: number;
  color: string;
}

export interface Metrics {
  totalLiquid: number;
  totalInvestment: number;
  totalPersonal: number;
  liabShort: number;
  liabLong: number;
  totalLiab: number;
  investableNetWorth: number;
  totalNetWorth: number;
  liquidHigh: number;
  currentRatio: number | null;
  incomeActive: number;
  incomePassive: number;
  expense: number;
  expenseFixed: number;
  expenseVariable: number;
  passiveRatio: number | null;
  savings: number;
  byCat: ByCatSlice[];
}

const sum = <T,>(rows: T[] | undefined, pick: (r: T) => number) => (rows || []).reduce((s, r) => s + Number(pick(r) || 0), 0);

export function useCycleRange(): CycleRange {
  const [cycleStartDay] = useSetting<number>("cycleStartDay", 1);
  const [shiftWeekend] = useSetting<boolean>("shiftWeekend", false);
  return getCycleRange(cycleStartDay, shiftWeekend);
}

export function useMetrics(): { metrics: Metrics; cycleRange: CycleRange; loading: boolean } {
  const cycleRange = useCycleRange();

  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], [] as LiquidAsset[]);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], [] as InvestmentAsset[]);
  const personal = useLiveQuery(() => db.personalAssets.toArray(), [], [] as PersonalAsset[]);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], [] as Liability[]);
  const cashflow = useLiveQuery(() => db.cashflow.toArray(), [], [] as CashFlowEntry[]);
  const goals = useLiveQuery(() => db.goals.toArray(), [], [] as Goal[]);

  const totalLiquid = sum(liquid, (a) => a.current_value);
  const totalInvestment = sum(investment, (a) => a.current_value);
  const totalPersonal = sum(personal, (a) => a.current_value);
  const liabShort = sum((liabilities || []).filter((l) => l.term === "ShortTerm"), (l) => l.balance);
  const liabLong = sum((liabilities || []).filter((l) => l.term === "LongTerm"), (l) => l.balance);
  const totalLiab = liabShort + liabLong;
  const investableNetWorth = totalLiquid + totalInvestment - totalLiab;
  const totalNetWorth = totalLiquid + totalInvestment + totalPersonal - totalLiab;
  const investmentLiquidHigh = sum((investment || []).filter((a) => a.liquidity === "สูง"), (a) => a.current_value);
  const liquidHigh = totalLiquid + investmentLiquidHigh;
  const currentRatio = liabShort > 0 ? liquidHigh / liabShort : null;

  const cycleCF = (cashflow || []).filter((c) => inRange(c.date, cycleRange));
  const incomeActive = sum(cycleCF.filter((c) => c.type === "Income" && c.incomeClass === "Active"), (c) => c.amount);
  const incomePassive = sum(cycleCF.filter((c) => c.type === "Income" && c.incomeClass === "Passive"), (c) => c.amount);
  const expenses = cycleCF.filter((c) => c.type === "Expense");
  const expenseFixed = sum(expenses.filter((c) => c.expense_class === "Fixed"), (c) => c.amount);
  const expenseVariable = sum(expenses.filter((c) => c.expense_class !== "Fixed"), (c) => c.amount);
  const expense = expenseFixed + expenseVariable;
  const passiveRatio = expense > 0 ? incomePassive / expense : null;
  const savings = incomeActive + incomePassive - expense;

  const byCat: ByCatSlice[] = CATS.map((c) => ({
    name: c.label,
    key: c.key,
    value: sum((investment || []).filter((a) => a.category === c.key), (a) => a.current_value),
    color: c.color,
  })).filter((c) => c.value > 0);

  const loading = liquid === undefined || investment === undefined || personal === undefined || liabilities === undefined || cashflow === undefined || goals === undefined;

  return {
    metrics: {
      totalLiquid, totalInvestment, totalPersonal, liabShort, liabLong, totalLiab,
      investableNetWorth, totalNetWorth, liquidHigh, currentRatio,
      incomeActive, incomePassive, expense, expenseFixed, expenseVariable,
      passiveRatio, savings, byCat,
    },
    cycleRange,
    loading,
  };
}
