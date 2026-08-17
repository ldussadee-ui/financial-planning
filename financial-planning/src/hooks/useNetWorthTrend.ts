"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { buildBuckets, type AssetGranularity } from "@/lib/netWorthBuckets";
import type { NetWorthSnapshot } from "@/lib/types";

export interface NetWorthPoint {
  label: string;
  assets: number | null;
  liab: number | null;
  netWorth: number | null;
}

// Each bucket's value is the latest snapshot dated within it — not a true
// period-end close, since the app only records a snapshot when it's open.
// A bucket with no snapshot at all shows as a gap (null), not a guess.
export function useNetWorthTrend(granularity: AssetGranularity, count: number) {
  const snapshots = useLiveQuery(() => db.netWorthHistory.orderBy("date").toArray(), [], [] as NetWorthSnapshot[]);
  const loading = snapshots === undefined;
  const buckets = buildBuckets(granularity, count);

  const points: NetWorthPoint[] = buckets.map((b) => {
    const inRange = snapshots.filter((s) => s.date >= b.startISO && s.date <= b.endISO);
    const latest = inRange.length ? inRange[inRange.length - 1] : null;
    if (!latest) return { label: b.label, assets: null, liab: null, netWorth: null };
    const assets = latest.totalLiquid + latest.totalInvestment + latest.totalPersonal;
    return { label: b.label, assets, liab: latest.totalLiab, netWorth: assets - latest.totalLiab };
  });

  return { points, loading };
}
