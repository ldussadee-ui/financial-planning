"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { isoToday } from "@/lib/calc";

// Records today's total liquid/investment/personal/liability values into
// netWorthHistory whenever any of those tables changes (add/edit/delete, or
// a bulk import) — overwriting today's own row if one already exists, so
// this never accumulates more than one snapshot per day. This is the only
// way the app captures history, since asset rows themselves only ever hold
// their current value.
export function NetWorthSnapshotter() {
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const personal = useLiveQuery(() => db.personalAssets.toArray(), [], []);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);

  useEffect(() => {
    if (!liquid || !investment || !personal || !liabilities) return;
    const totalLiquid = liquid.reduce((s, a) => s + Number(a.current_value || 0), 0);
    const totalInvestment = investment.reduce((s, a) => s + Number(a.current_value || 0), 0);
    const totalPersonal = personal.reduce((s, a) => s + Number(a.current_value || 0), 0);
    const totalLiab = liabilities.reduce((s, a) => s + Number(a.balance || 0), 0);
    void db.netWorthHistory.put({ date: isoToday(), totalLiquid, totalInvestment, totalPersonal, totalLiab });
  }, [liquid, investment, personal, liabilities]);

  return null;
}
