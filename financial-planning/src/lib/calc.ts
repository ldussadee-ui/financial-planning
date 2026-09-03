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

export function adjustForWeekend(date: Date, shiftWeekend: boolean) {
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
export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
// Clamps cycleStartDay to the month's last day (e.g. 31 in a 30-day month)
// before applying the weekend shift, so a short month never silently
// overflows into the next one via native Date's day-overflow behavior.
function computeAdjustedStart(year: number, month: number, cycleStartDay: number, shiftWeekend: boolean) {
  const clampedDay = Math.min(cycleStartDay, daysInMonth(year, month));
  return adjustForWeekend(new Date(year, month, clampedDay), shiftWeekend);
}

export interface CycleRange {
  start: Date;
  end: Date;
}

export function getCycleRange(cycleStartDay: number, shiftWeekend: boolean, ref: Date = new Date()): CycleRange {
  // anchorYear/anchorMonth track which calendar month this cycle's start
  // conceptually belongs to, kept separate from `start` itself: the weekend
  // shift can push `start` backward into the previous month (e.g. day 1
  // falling on a Saturday shifts to the 31st), and the next cycle's start
  // must still be computed one month after the real anchor, not one month
  // after wherever the shift happened to land.
  let anchorYear = ref.getFullYear();
  let anchorMonth = ref.getMonth();
  let start = computeAdjustedStart(anchorYear, anchorMonth, cycleStartDay, shiftWeekend);
  if (ref < start) {
    const prevMonth = new Date(anchorYear, anchorMonth - 1, 1);
    anchorYear = prevMonth.getFullYear();
    anchorMonth = prevMonth.getMonth();
    start = computeAdjustedStart(anchorYear, anchorMonth, cycleStartDay, shiftWeekend);
  }
  const nextMonth = new Date(anchorYear, anchorMonth + 1, 1);
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

// Whole months from today to a yyyy-mm-dd date, or null if unparseable.
// Negative when the date has passed. Month-granular on purpose: every
// savings figure here is monthly, so counting part-months would imply a
// precision the estimate doesn't have.
export function monthsUntilDate(date: string, today: Date = new Date()): number | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
}

// The monthly contribution needed to reach a target exactly on time, given
// what's already saved and an assumed annual return — standard
// future-value-of-annuity math. Returns 0 if the lump sum alone is already
// projected to get there. Purely an estimate: real returns are never
// guaranteed, this just answers "at this assumed rate, how much per month."
export function monthlySavingsNeeded(
  target: number, linked: number, monthsRemaining: number | null, annualReturnPct: number,
): number | null {
  if (monthsRemaining === null || monthsRemaining <= 0) return null;
  const annualReturn = (annualReturnPct || 0) / 100;
  const i = annualReturn > 0 ? Math.pow(1 + annualReturn, 1 / 12) - 1 : 0;
  const futureValueOfLump = i > 0 ? linked * Math.pow(1 + i, monthsRemaining) : linked;
  const needed = target - futureValueOfLump;
  if (needed <= 0) return 0;
  if (i === 0) return needed / monthsRemaining;
  return (needed * i) / (Math.pow(1 + i, monthsRemaining) - 1);
}

export function recommendedMonthlySavings(goal: Goal, linked: number, today: Date = new Date()): number | null {
  return monthlySavingsNeeded(goal.target, linked, monthsUntilDate(goal.date, today), goal.expectedReturn || 0);
}

/* ------------------------------ retirement ------------------------------ */

export interface RetirementPlan {
  monthlySpend: number;         // stated in today's money
  yearsUntilRetirement: number;
  retirementYears: number;      // how long the money has to last
  inflationRate: number;        // percent per year
  postRetirementReturn: number; // percent per year; 0 = the pot stops growing
}

// What the pot has to hold on the first day of retirement. Spending is
// given in today's money, so it is inflated forward to the retirement date
// first; the pot is then either the still-inflating spend summed year by
// year (when the money stops growing) or that stream discounted at the real
// rate — the return net of inflation — when the remaining balance keeps
// earning. Defaulting the return to match inflation makes the real rate
// zero, which is simply "enough to cover N years of spending".
//
// Both branches take the year's spending out at the START of the year, so
// the first one is never discounted: you retire and immediately need that
// year's money. The `(1 + real)` factor is what makes the discounted branch
// an annuity-due rather than an ordinary annuity. Without it the two
// branches disagreed by a factor of (1 + inflation), and raising the return
// off zero made the target jump *up* by ~3% — earning more can never
// require saving more.
//
// Withdrawals are modelled as one lump per year rather than twelve monthly
// ones, which overstates the pot by 1-4% depending on the return. That is
// deliberate: it errs toward asking for too much, and it is far smaller
// than the uncertainty in assumptions reaching decades ahead.
//
// Every figure here comes from assumptions the user supplies. It is an
// arithmetic projection of those assumptions, not a forecast of real
// returns and not advice about what any of them should be.
export function retirementTargetAmount(plan: RetirementPlan): {
  monthlyAtRetirement: number;
  total: number;
} {
  const inflation = Math.max(0, plan.inflationRate) / 100;
  const postReturn = Math.max(0, plan.postRetirementReturn) / 100;
  const years = Math.max(0, plan.retirementYears);
  const monthlyAtRetirement =
    Math.max(0, plan.monthlySpend) * Math.pow(1 + inflation, Math.max(0, plan.yearsUntilRetirement));
  const annual = monthlyAtRetirement * 12;

  let total: number;
  if (postReturn > 0) {
    const real = (1 + postReturn) / (1 + inflation) - 1;
    total = Math.abs(real) < 1e-9
      ? annual * years
      : (annual * (1 - Math.pow(1 + real, -years)) * (1 + real)) / real;
  } else {
    total = inflation < 1e-9
      ? annual * years
      : (annual * (Math.pow(1 + inflation, years) - 1)) / inflation;
  }
  return { monthlyAtRetirement, total };
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
