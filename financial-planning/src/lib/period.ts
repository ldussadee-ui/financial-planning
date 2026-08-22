// A navigable calendar period at month / half-year / year granularity, used
// by the expense report to drill into "what did I spend in August 2026"
// rather than trend lines across many periods at once.
import type { Language } from "./i18n";

export type Granularity = "month" | "halfYear" | "year";

export interface Period {
  granularity: Granularity;
  year: number;
  index: number; // 0-11 for month, 0-1 for halfYear (H1/H2), always 0 for year
}

const UNITS_PER_YEAR: Record<Granularity, number> = { month: 12, halfYear: 2, year: 1 };

export function defaultPeriod(granularity: Granularity, ref: Date = new Date()): Period {
  const year = ref.getFullYear();
  if (granularity === "month") return { granularity, year, index: ref.getMonth() };
  if (granularity === "halfYear") return { granularity, year, index: ref.getMonth() < 6 ? 0 : 1 };
  return { granularity, year, index: 0 };
}

export function shiftPeriod(period: Period, delta: number): Period {
  const unitsPerYear = UNITS_PER_YEAR[period.granularity];
  const total = period.year * unitsPerYear + period.index + delta;
  const year = Math.floor(total / unitsPerYear);
  const index = ((total % unitsPerYear) + unitsPerYear) % unitsPerYear;
  return { granularity: period.granularity, year, index };
}

export function periodRange(period: Period): { start: Date; end: Date } {
  if (period.granularity === "month") {
    return { start: new Date(period.year, period.index, 1), end: new Date(period.year, period.index + 1, 0) };
  }
  if (period.granularity === "halfYear") {
    const startMonth = period.index * 6;
    return { start: new Date(period.year, startMonth, 1), end: new Date(period.year, startMonth + 6, 0) };
  }
  return { start: new Date(period.year, 0, 1), end: new Date(period.year, 12, 0) };
}

export function periodContains(period: Period, iso: string): boolean {
  if (!iso) return false;
  const { start, end } = periodRange(period);
  const d = new Date(iso + "T00:00:00");
  return d >= start && d <= end;
}

export function periodLabel(period: Period, lang: Language = "th"): string {
  const locale = lang === "en" ? "en-US" : "th-TH";
  if (period.granularity === "month") {
    return new Date(period.year, period.index, 1).toLocaleDateString(locale, { month: "long", year: "numeric", calendar: "gregory" });
  }
  if (period.granularity === "halfYear") {
    const yearLabel = new Date(period.year, 0, 1).toLocaleDateString(locale, { year: "numeric", calendar: "gregory" });
    return lang === "en" ? `H${period.index + 1} ${yearLabel}` : `ครึ่งปี${period.index === 0 ? "แรก" : "หลัง"} ${yearLabel}`;
  }
  return new Date(period.year, 0, 1).toLocaleDateString(locale, { year: "numeric", calendar: "gregory" });
}
