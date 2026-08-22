import type { Metrics } from "@/hooks/useMetrics";
import type { InsurancePolicy } from "./types";
import type { Language } from "./i18n";
import { TR } from "./i18n";
import { fmt } from "./calc";

export type InsuranceCheckStatus = "pass" | "fail" | "nodata";

export interface InsuranceCheck {
  key: string;
  name: string;
  formulaLabel: string;
  standardLabel: string;
  displayValue: string;
  status: InsuranceCheckStatus;
  advice: string | null;
}

// Coverage this generous is a common rule of thumb, not a guarantee the
// household is fully protected — it's meant to catch an obvious shortfall,
// the same spirit as the standard ratios on the Financial Ratios page.
const YEARS_OF_PROTECTION = 10;
const PREMIUM_TO_INCOME_MAX_PCT = 15;

const sumByType = (policies: InsurancePolicy[], type: InsurancePolicy["policyType"], pick: (p: InsurancePolicy) => number) =>
  policies.filter((p) => p.policyType === type).reduce((s, p) => s + Number(pick(p) || 0), 0);

// Computes the same small set of insurance "gap" checks regardless of
// language, then picks the display strings for `lang` — mirrors the
// ratio()/computeFinancialRatios() pattern in financialRatios.ts.
export function computeInsuranceChecks(metrics: Metrics, policies: InsurancePolicy[], lang: Language): InsuranceCheck[] {
  const t = <K extends { th: string; en: string }>(entry: K) => entry[lang];
  const livingExpenseAnnual = (metrics.expenseFixed + metrics.expenseVariable) * 12;
  const totalIncomeAnnual = (metrics.incomeActive + metrics.incomePassive) * 12;

  // 1. Life insurance gap — needs-based: years of living expenses plus
  // outstanding debt, minus liquid/investment assets already available to
  // cover it.
  const recommendedLife = Math.max(
    0,
    livingExpenseAnnual * YEARS_OF_PROTECTION + metrics.totalLiab - (metrics.totalLiquid + metrics.totalInvestment)
  );
  const existingLife = sumByType(policies, "ชีวิต", (p) => p.sumAssured);
  const lifeStatus: InsuranceCheckStatus = existingLife >= recommendedLife ? "pass" : "fail";

  // 2. Health coverage — simple existence check; there's no reliable
  // textbook minimum sum-assured to compare against.
  const hasHealth = policies.some((p) => p.policyType === "สุขภาพ");
  const healthStatus: InsuranceCheckStatus = hasHealth ? "pass" : "fail";

  // 3. Credit life vs. remaining long-term debt (mortgage/auto loan style
  // secured debt) — no long-term debt means the check doesn't apply.
  const existingCreditLife = sumByType(policies, "คุ้มครองสินเชื่อ", (p) => p.sumAssured);
  const creditLifeStatus: InsuranceCheckStatus =
    metrics.liabLong <= 0 ? "nodata" : existingCreditLife >= metrics.liabLong ? "pass" : "fail";

  // 4. Total premiums relative to income.
  const totalPremium = policies.reduce((s, p) => s + Number(p.annualPremium || 0), 0);
  const premiumPct = totalIncomeAnnual > 0 ? (totalPremium / totalIncomeAnnual) * 100 : null;
  const premiumStatus: InsuranceCheckStatus = premiumPct === null ? "nodata" : premiumPct <= PREMIUM_TO_INCOME_MAX_PCT ? "pass" : "fail";

  return [
    {
      key: "lifeGap",
      name: t(TR.insurance.lifeGapName),
      formulaLabel: t(TR.insurance.lifeGapFormula),
      standardLabel: `${t(TR.insurance.recommendedAtLeast)} ${fmt(recommendedLife)}`,
      displayValue: fmt(existingLife),
      status: lifeStatus,
      advice: lifeStatus === "fail" ? t(TR.insurance.lifeGapAdvice) : null,
    },
    {
      key: "health",
      name: t(TR.insurance.healthName),
      formulaLabel: t(TR.insurance.healthFormula),
      standardLabel: t(TR.insurance.healthStandard),
      displayValue: hasHealth ? t(TR.insurance.healthHas) : t(TR.insurance.healthNone),
      status: healthStatus,
      advice: healthStatus === "fail" ? t(TR.insurance.healthAdvice) : null,
    },
    {
      key: "creditLife",
      name: t(TR.insurance.creditLifeName),
      formulaLabel: t(TR.insurance.creditLifeFormula),
      standardLabel: creditLifeStatus === "nodata" ? "—" : `${t(TR.insurance.recommendedAtLeast)} ${fmt(metrics.liabLong)}`,
      displayValue: fmt(existingCreditLife),
      status: creditLifeStatus,
      advice: creditLifeStatus === "fail" ? t(TR.insurance.creditLifeAdvice) : null,
    },
    {
      key: "premiumToIncome",
      name: t(TR.insurance.premiumName),
      formulaLabel: t(TR.insurance.premiumFormula),
      standardLabel: t(TR.insurance.premiumStandard),
      displayValue: premiumPct === null ? "—" : premiumPct.toFixed(1) + "%",
      status: premiumStatus,
      advice: premiumStatus === "fail" ? t(TR.insurance.premiumAdvice) : null,
    },
  ];
}

const DAYS_UNTIL_EXPIRY_ALERT = 60;

export function findExpiringPolicies(policies: InsurancePolicy[], today: Date = new Date()): InsurancePolicy[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + DAYS_UNTIL_EXPIRY_ALERT);
  return policies.filter((p) => {
    if (!p.expiryDate) return false;
    const d = new Date(p.expiryDate + "T00:00:00");
    return d >= today && d <= cutoff;
  });
}

export function findPoliciesWithoutBeneficiary(policies: InsurancePolicy[]): InsurancePolicy[] {
  return policies.filter((p) => !p.beneficiarySet);
}
