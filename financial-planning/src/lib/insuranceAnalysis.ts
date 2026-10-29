import type { Metrics } from "@/hooks/useMetrics";
import type { InsurancePolicy, Liability } from "./types";
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
  // Per-loan breakdown, only on the credit-life check.
  loans?: LoanCoverage[];
}

export interface LoanCoverage {
  liability: Liability;
  // Paid straight to the lender (credit-life / MRTA).
  lenderCovered: number;
  // Life cover the heirs are meant to use to pay this loan off themselves.
  heirCovered: number;
  covered: number;
  shortfall: number;
  policies: InsurancePolicy[];
}

// Coverage this generous is a common rule of thumb, not a guarantee the
// household is fully protected — it's meant to catch an obvious shortfall,
// the same spirit as the standard ratios on the Financial Ratios page.
const YEARS_OF_PROTECTION = 10;
const PREMIUM_TO_INCOME_MAX_PCT = 15;

const CREDIT_LIFE: InsurancePolicy["policyType"] = "คุ้มครองสินเชื่อ";
const LIFE: InsurancePolicy["policyType"] = "ชีวิต";

// Only credit-life and life policies can be tied to loans; a type change in
// the form leaves stale ids behind, so the type is checked here too.
const linkableType = (p: InsurancePolicy) => p.policyType === CREDIT_LIFE || p.policyType === LIFE;

// What one policy puts towards its linked loans.
function debtPool(p: InsurancePolicy): number {
  const sum = Number(p.sumAssured || 0);
  if (p.policyType === LIFE && p.debtEarmark != null && p.debtEarmark > 0) return Math.min(sum, p.debtEarmark);
  return sum;
}

// A policy's cover per year, so a lump-sum MRTA premium isn't counted as if
// it were paid again every year.
export function yearlyPremium(p: InsurancePolicy): number {
  const premium = Number(p.annualPremium || 0);
  if (p.premiumMode === "single") return premium / Math.max(1, Number(p.coverageYears || 1));
  return premium;
}

// Splits each linked policy's cover across its loans in proportion to their
// remaining balance (the owner's choice over typing an amount per loan), so
// the split follows the balances down as they're paid off. Returns one row
// per loan in `liabilities`, whether or not anything covers it.
export function computeLoanCoverage(policies: InsurancePolicy[], liabilities: Liability[]): LoanCoverage[] {
  const byId = new Map(liabilities.map((l) => [l.id, l]));
  const rows = new Map<string, LoanCoverage>(
    liabilities.map((l) => [l.id, { liability: l, lenderCovered: 0, heirCovered: 0, covered: 0, shortfall: 0, policies: [] }])
  );
  for (const p of policies) {
    if (!linkableType(p)) continue;
    const loans = (p.liabilityIds || []).map((id) => byId.get(id)).filter((l): l is Liability => !!l);
    if (!loans.length) continue;
    const pool = debtPool(p);
    const totalBalance = loans.reduce((s, l) => s + Math.max(0, l.balance), 0);
    for (const l of loans) {
      const share = totalBalance > 0 ? (pool * Math.max(0, l.balance)) / totalBalance : pool / loans.length;
      const row = rows.get(l.id)!;
      if (p.policyType === CREDIT_LIFE) row.lenderCovered += share;
      else row.heirCovered += share;
      row.policies.push(p);
    }
  }
  for (const row of rows.values()) {
    row.covered = row.lenderCovered + row.heirCovered;
    row.shortfall = Math.max(0, row.liability.balance - row.covered);
  }
  return liabilities.map((l) => rows.get(l.id)!);
}

// Credit-life policies the owner hasn't tied to any (still existing) loan.
export function findUnlinkedCreditLife(policies: InsurancePolicy[], liabilities: Liability[]): InsurancePolicy[] {
  const ids = new Set(liabilities.map((l) => l.id));
  return policies.filter((p) => p.policyType === CREDIT_LIFE && !(p.liabilityIds || []).some((id) => ids.has(id)));
}

const sumByType = (policies: InsurancePolicy[], type: InsurancePolicy["policyType"], pick: (p: InsurancePolicy) => number) =>
  policies.filter((p) => p.policyType === type).reduce((s, p) => s + Number(pick(p) || 0), 0);

// Computes the same small set of insurance "gap" checks regardless of
// language, then picks the display strings for `lang` — mirrors the
// ratio()/computeFinancialRatios() pattern in financialRatios.ts.
export function computeInsuranceChecks(metrics: Metrics, policies: InsurancePolicy[], liabilities: Liability[], lang: Language): InsuranceCheck[] {
  const t = <K extends { th: string; en: string }>(entry: K) => entry[lang];
  const livingExpenseAnnual = (metrics.expenseFixed + metrics.expenseVariable) * 12;
  const totalIncomeAnnual = (metrics.incomeActive + metrics.incomePassive) * 12;

  const loanCoverage = computeLoanCoverage(policies, liabilities);

  // 1. Life insurance gap — needs-based: years of living expenses plus
  // outstanding debt, minus liquid/investment assets already available to
  // cover it. Debt a credit-life policy pays the lender directly is left out:
  // the family never has to find that money. Life cover set aside for loans
  // still counts in full below, since it reaches the family first.
  const lenderPaidDebt = loanCoverage.reduce((s, c) => s + Math.min(c.lenderCovered, c.liability.balance), 0);
  const recommendedLife = Math.max(
    0,
    livingExpenseAnnual * YEARS_OF_PROTECTION + metrics.totalLiab - lenderPaidDebt - (metrics.totalLiquid + metrics.totalInvestment)
  );
  const existingLife = sumByType(policies, "ชีวิต", (p) => p.sumAssured);
  const lifeStatus: InsuranceCheckStatus = existingLife >= recommendedLife ? "pass" : "fail";

  // 2. Health coverage — simple existence check; there's no reliable
  // textbook minimum sum-assured to compare against.
  const hasHealth = policies.some((p) => p.policyType === "สุขภาพ");
  const healthStatus: InsuranceCheckStatus = hasHealth ? "pass" : "fail";

  // 3. Loan cover, one long-term loan at a time (short-term debt such as
  // credit cards rarely carries this kind of cover) — every loan must be
  // covered up to its remaining balance, by credit life or by life cover set
  // aside for it. No long-term debt means the check doesn't apply.
  const longLoans = loanCoverage.filter((c) => c.liability.term === "LongTerm" && c.liability.balance > 0);
  const longCovered = longLoans.reduce((s, c) => s + Math.min(c.covered, c.liability.balance), 0);
  const creditLifeStatus: InsuranceCheckStatus =
    longLoans.length === 0 ? "nodata" : longLoans.every((c) => c.shortfall <= 0.5) ? "pass" : "fail";

  // 4. Total premiums relative to income.
  const totalPremium = policies.reduce((s, p) => s + yearlyPremium(p), 0);
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
      standardLabel: creditLifeStatus === "nodata" ? "—" : `${t(TR.insurance.recommendedAtLeast)} ${fmt(longLoans.reduce((s, c) => s + c.liability.balance, 0))}`,
      displayValue: fmt(longCovered),
      status: creditLifeStatus,
      advice: creditLifeStatus === "fail" ? t(TR.insurance.creditLifeAdvice) : null,
      loans: longLoans,
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

// Credit-life policies name the lender as beneficiary by design, so they
// never need one set.
export function findPoliciesWithoutBeneficiary(policies: InsurancePolicy[]): InsurancePolicy[] {
  return policies.filter((p) => !p.beneficiarySet && p.policyType !== CREDIT_LIFE);
}
