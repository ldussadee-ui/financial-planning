import { isoDate } from "./calc";

export type AssetGranularity = "month" | "quarter" | "halfYear" | "year";

export interface AssetBucket {
  label: string;
  startISO: string;
  endISO: string;
}

const UNIT_MONTHS: Record<AssetGranularity, number> = { month: 1, quarter: 3, halfYear: 6, year: 12 };

function monthBounds(year: number, month: number) {
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
}

function bucketLabel(granularity: AssetGranularity, year: number, month: number): string {
  const buddhistShort = String((year + 543) % 100).padStart(2, "0");
  if (granularity === "month") return new Date(year, month, 1).toLocaleDateString("th-TH", { month: "short" });
  if (granularity === "quarter") return `Q${Math.floor(month / 3) + 1} ${buddhistShort}`;
  if (granularity === "halfYear") return `H${Math.floor(month / 6) + 1} ${buddhistShort}`;
  return String(year + 543);
}

// Trailing `count` calendar-aligned buckets of the given granularity, oldest
// first, ending at whichever bucket `ref` currently falls in. Quarters are
// Jan-Mar/Apr-Jun/Jul-Sep/Oct-Dec, half-years are Jan-Jun/Jul-Dec — not a
// rolling 3/6/12-month window.
export function buildBuckets(granularity: AssetGranularity, count: number, ref: Date = new Date()): AssetBucket[] {
  const unit = UNIT_MONTHS[granularity];
  const totalMonths = ref.getFullYear() * 12 + ref.getMonth();
  const currentUnitIndex = Math.floor(totalMonths / unit);
  const buckets: AssetBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const unitIndex = currentUnitIndex - i;
    const startMonthTotal = unitIndex * unit;
    const endMonthTotal = startMonthTotal + unit - 1;
    const startYear = Math.floor(startMonthTotal / 12);
    const startMonth = ((startMonthTotal % 12) + 12) % 12;
    const endYear = Math.floor(endMonthTotal / 12);
    const endMonth = ((endMonthTotal % 12) + 12) % 12;
    buckets.push({
      label: bucketLabel(granularity, startYear, startMonth),
      startISO: isoDate(monthBounds(startYear, startMonth).start),
      endISO: isoDate(monthBounds(endYear, endMonth).end),
    });
  }
  return buckets;
}
