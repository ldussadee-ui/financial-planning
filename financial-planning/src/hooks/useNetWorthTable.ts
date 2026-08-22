"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { buildBuckets } from "@/lib/netWorthBuckets";
import type { Language } from "@/lib/i18n";
import type { NetWorthSnapshot } from "@/lib/types";

export interface NetWorthTableRow {
  label: string;
  assets: number | null;
  liab: number | null;
  netWorth: number | null;
  delta: number | null;
  pct: number | null;
}

// Monthly rows (oldest first while computing deltas, then reversed to
// newest-first for display), each with the change vs the previous month.
export function useNetWorthTable(monthCount: number, lang: Language = "th") {
  const snapshots = useLiveQuery(() => db.netWorthHistory.orderBy("date").toArray(), [], [] as NetWorthSnapshot[]);
  const loading = snapshots === undefined;
  const buckets = buildBuckets("month", monthCount, new Date(), lang);

  const rows: NetWorthTableRow[] = buckets.map((b) => {
    const inRange = snapshots.filter((s) => s.date >= b.startISO && s.date <= b.endISO);
    const latest = inRange.length ? inRange[inRange.length - 1] : null;
    if (!latest) return { label: b.label, assets: null, liab: null, netWorth: null, delta: null, pct: null };
    const assets = latest.totalLiquid + latest.totalInvestment + latest.totalPersonal;
    return { label: b.label, assets, liab: latest.totalLiab, netWorth: assets - latest.totalLiab, delta: null, pct: null };
  });

  for (let i = 1; i < rows.length; i++) {
    const cur = rows[i];
    const prev = rows[i - 1];
    if (cur.netWorth !== null && prev.netWorth !== null) {
      cur.delta = cur.netWorth - prev.netWorth;
      cur.pct = prev.netWorth !== 0 ? (cur.delta / prev.netWorth) * 100 : null;
    }
  }

  return { rows: [...rows].reverse(), loading };
}
