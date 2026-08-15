import { FIXED_KEYWORDS, INVEST_KEYWORDS, PASSIVE_KEYWORDS } from "./constants";
import type { ExpenseClass, IncomeClass } from "./types";

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
export const fmtDateShort = (iso: string) => {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
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

export function fmtRange(range: CycleRange): string {
  const s = range.start.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  const e = range.end.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}
