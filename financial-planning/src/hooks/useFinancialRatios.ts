"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMetrics } from "./useMetrics";
import { computeFinancialRatios, type FinancialRatio } from "@/lib/financialRatios";
import type { Language } from "@/lib/i18n";
import type { Liability } from "@/lib/types";

export function useFinancialRatios(lang: Language = "th"): { ratios: FinancialRatio[]; passCount: number; total: number; loading: boolean } {
  const { metrics, loading: metricsLoading } = useMetrics();
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], [] as Liability[]);
  const loading = metricsLoading || liabilities === undefined;

  if (loading) return { ratios: [], passCount: 0, total: 10, loading: true };

  const debtServicePerMonth = liabilities.reduce((s, l) => s + Number(l.monthly || 0), 0);
  const ratios = computeFinancialRatios(metrics, debtServicePerMonth, lang);
  const passCount = ratios.filter((r) => r.status === "pass").length;

  return { ratios, passCount, total: ratios.length, loading: false };
}
