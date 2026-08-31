import { db } from "./db";
import { adjustForWeekend, classifyExpense, classifyIncome, daysInMonth, isoDate, uid } from "./calc";
import type { CashFlowEntry, CashFlowType, RecurringEntry } from "./types";

// `month` is 0-indexed (JS Date convention). Clamps to the month's last day
// (e.g. day 31 in a 30-day month) before applying the weekend shift.
function dateForDayOfMonth(year: number, month: number, dayOfMonth: number, shiftWeekend: boolean): Date {
  const clamped = Math.min(dayOfMonth, daysInMonth(year, month));
  return adjustForWeekend(new Date(year, month, clamped), shiftWeekend);
}

const yearMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
// `key`'s month is 1-indexed (e.g. "08" for August); passing it straight in
// as a 0-indexed Date month arg lands one month later, which is the next
// month — and JS Date normalizes month 12 into January of the next year, so
// December correctly rolls over too.
function nextYearMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return yearMonthKey(new Date(y, m, 1));
}

function cashflowFieldsFor(rule: Pick<RecurringEntry, "type" | "category" | "payment_method_id">) {
  return rule.type === "Income"
    ? { incomeClass: classifyIncome(rule.category) }
    : { expense_class: classifyExpense(rule.category), payment_method_id: rule.payment_method_id ?? null };
}

export interface GeneratedEntryInfo {
  type: CashFlowType;
  category: string;
  amount: number;
}

export type NewRecurringEntryInput = Omit<RecurringEntry, "id" | "active" | "lastGeneratedYearMonth">;

// Creates a recurring rule and, if this month's occurrence hasn't passed yet,
// immediately generates that first entry too (so it shows up right away
// instead of waiting for the next app open). If the day already passed this
// month, generation starts next month instead — this month is marked
// accounted-for either way, so runRecurringGeneration() never re-considers
// it (e.g. to backfill a month the user may have already entered by hand).
export async function createRecurringRule(input: NewRecurringEntryInput): Promise<GeneratedEntryInfo | null> {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentKey = yearMonthKey(today);
  const occursOn = dateForDayOfMonth(today.getFullYear(), today.getMonth(), input.dayOfMonth, input.shiftWeekend);
  const hasPassed = occursOn < todayMidnight;

  const rule: RecurringEntry = { ...input, id: uid(), active: true, lastGeneratedYearMonth: currentKey };
  await db.recurringEntries.add(rule);

  if (hasPassed) return null;

  const entry: CashFlowEntry = {
    id: uid(), type: rule.type, category: rule.category, amount: rule.amount,
    date: isoDate(occursOn), recurringId: rule.id, ...cashflowFieldsFor(rule),
  };
  await db.cashflow.add(entry);
  return { type: rule.type, category: rule.category, amount: rule.amount };
}

// Catches up every active rule to the current month, generating one entry
// per month it hasn't accounted for yet (in order, so a long-unopened app
// backfills correctly). No server/cron exists in this local-only app, so
// this only ever runs when the app itself is opened.
export async function runRecurringGeneration(today: Date = new Date()): Promise<GeneratedEntryInfo[]> {
  const rules = await db.recurringEntries.toArray();
  const currentKey = yearMonthKey(today);
  const created: GeneratedEntryInfo[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    let cursorKey = rule.lastGeneratedYearMonth;
    let targetKey = nextYearMonthKey(cursorKey);
    while (targetKey <= currentKey) {
      const [y, m] = targetKey.split("-").map(Number);
      const occursOn = dateForDayOfMonth(y, m - 1, rule.dayOfMonth, rule.shiftWeekend);
      const entry: CashFlowEntry = {
        id: uid(), type: rule.type, category: rule.category, amount: rule.amount,
        date: isoDate(occursOn), recurringId: rule.id, ...cashflowFieldsFor(rule),
      };
      await db.cashflow.add(entry);
      created.push({ type: rule.type, category: rule.category, amount: rule.amount });
      cursorKey = targetKey;
      targetKey = nextYearMonthKey(targetKey);
    }
    if (cursorKey !== rule.lastGeneratedYearMonth) {
      await db.recurringEntries.update(rule.id, { lastGeneratedYearMonth: cursorKey });
    }
  }
  return created;
}
