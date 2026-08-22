import { FIXED_KEYWORDS, INVEST_KEYWORDS, PASSIVE_KEYWORDS } from "./constants";
import type { CashFlowEntry, ExpenseClass, Goal, IncomeClass } from "./types";
import type { Language } from "./i18n";

export const classifyExpense = (category: string): ExpenseClass => {
  const t = (category || "").toLowerCase();
  if (INVEST_KEYWORDS.some((k) => t.includes(k.toLowerCase()))) return "Invest";
  return FIXED_KEYWORDS.some((k) => t.includes(k.toLowerCase())) ? "Fixed" : "Variable";
};

export const classifyIncome = (category: string): IncomeClass => {
  const t = (category || "").toLowerCase();
  return PASSIVE_KEYWORDS.some((k) => t.includes(k.toLowerCase())) ? "Passive" : "Active";
};

export const fmt = (n: number | null | undefined) =>
  "฿" + Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

export const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------------------------- date / cycle helpers ------------------------------ */
const pad2 = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const isoToday = () => isoDate(new Date());
export const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};
export const fmtDateShort = (iso: string, lang: Language = "th") => {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short" });
};

function adjustForWeekend(date: Date, shiftWeekend: boolean) {
  if (!shiftWeekend) return date;
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  if (day === 6) {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (day === 0) {
    const d = new Date(date);
    d.setDate(d.getDate() - 2);
    return d;
  }
  return date;
}
function computeAdjustedStart(year: number, month: number, cycleStartDay: number, shiftWeekend: boolean) {
  return adjustForWeekend(new Date(year, month, cycleStartDay), shiftWeekend);
}

export interface CycleRange {
  start: Date;
  end: Date;
}

export function getCycleRange(cycleStartDay: number, shiftWeekend: boolean, ref: Date = new Date()): CycleRange {
  const candidateStart = computeAdjustedStart(ref.getFullYear(), ref.getMonth(), cycleStartDay, shiftWeekend);
  let start = candidateStart;
  if (ref < candidateStart) {
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
    start = computeAdjustedStart(prevMonth.getFullYear(), prevMonth.getMonth(), cycleStartDay, shiftWeekend);
  }
  const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const nextStart = computeAdjustedStart(nextMonth.getFullYear(), nextMonth.getMonth(), cycleStartDay, shiftWeekend);
  const end = new Date(nextStart);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

export function inRange(iso: string | undefined, range: CycleRange): boolean {
  if (!iso) return true;
  const d = new Date(iso + "T00:00:00");
  return d >= range.start && d <= range.end;
}

export function fmtRange(range: CycleRange, lang: Language = "th"): string {
  const locale = lang === "en" ? "en-US" : "th-TH";
  const s = range.start.toLocaleDateString(locale, { day: "numeric", month: "short" });
  const e = range.end.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", calendar: "gregory" });
  return `${s} – ${e}`;
}

/* ------------------------------- spending comparisons ------------------------------ */
// How many hours of work a spend represents, at the given hourly wage.
export function hoursOfWork(amount: number, hourlyWage: number): number | null {
  if (!hourlyWage || hourlyWage <= 0) return null;
  return amount / hourlyWage;
}

// How many days sooner a goal would be reached if this amount were saved
// toward it now, assuming a steady pace to hit the goal exactly by its
// deadline. If the goal has an expected annual return set, the amount is
// grown at that rate up to the deadline first (a simplified approximation —
// not a full re-solve of the annuity schedule, which recommendedMonthlySavings
// below does properly since that number carries more weight).
export function daysFasterToGoal(amount: number, goal: Goal, linked: number, today: Date = new Date()): number | null {
  if (!goal.date) return null;
  const deadline = new Date(goal.date + "T00:00:00");
  const daysRemaining = Math.round((deadline.getTime() - today.getTime()) / 86400000);
  if (daysRemaining <= 0) return null;
  const remainingGap = goal.target - linked;
  if (remainingGap <= 0) return null;
  const annualReturn = (goal.expectedReturn || 0) / 100;
  const futureValue = annualReturn > 0 ? amount * Math.pow(1 + annualReturn, daysRemaining / 365.25) : amount;
  return (futureValue * daysRemaining) / remainingGap;
}

// The monthly contribution needed to reach a goal exactly by its deadline,
// given what's already saved and the goal's expected annual return —
// standard future-value-of-annuity math. Returns 0 if the lump sum alone is
// already projected to reach the target. Purely an estimate: real returns
// are never guaranteed, this just answers "at this assumed rate, how much
// per month."
export function recommendedMonthlySavings(goal: Goal, linked: number, today: Date = new Date()): number | null {
  if (!goal.date) return null;
  const deadline = new Date(goal.date + "T00:00:00");
  const monthsRemaining = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
  if (monthsRemaining <= 0) return null;
  const annualReturn = (goal.expectedReturn || 0) / 100;
  const i = annualReturn > 0 ? Math.pow(1 + annualReturn, 1 / 12) - 1 : 0;
  const futureValueOfLump = i > 0 ? linked * Math.pow(1 + i, monthsRemaining) : linked;
  const needed = goal.target - futureValueOfLump;
  if (needed <= 0) return 0;
  if (i === 0) return needed / monthsRemaining;
  return (needed * i) / (Math.pow(1 + i, monthsRemaining) - 1);
}

/* -------------------------------- budgets ------------------------------- */
export interface BudgetStatus {
  category: string;
  spent: number;
  budget: number;
  pct: number;
}

// Pairs each budgeted category with what's actually been spent in the given
// entries (already pre-filtered to whatever date range matters), skipping
// categories with no budget set. Sorted worst-first so callers that only
// want the top offenders (e.g. a Dashboard alert card) can just slice it.
export function categoryBudgetStatus(entries: CashFlowEntry[], budgets: Map<string, number>): BudgetStatus[] {
  const spentByCategory = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== "Expense") continue;
    spentByCategory.set(e.category, (spentByCategory.get(e.category) || 0) + Number(e.amount || 0));
  }
  const result: BudgetStatus[] = [];
  for (const [category, budget] of budgets) {
    if (budget <= 0) continue;
    result.push({ category, spent: spentByCategory.get(category) || 0, budget, pct: (spentByCategory.get(category) || 0) / budget * 100 });
  }
  return result.sort((a, b) => b.pct - a.pct);
}
