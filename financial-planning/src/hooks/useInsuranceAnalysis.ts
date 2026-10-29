"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMetrics } from "./useMetrics";
import {
  computeInsuranceChecks, findExpiringPolicies, findPoliciesWithoutBeneficiary, findUnlinkedCreditLife, type InsuranceCheck,
} from "@/lib/insuranceAnalysis";
import type { Language } from "@/lib/i18n";
import type { InsurancePolicy, Liability } from "@/lib/types";

export function useInsuranceAnalysis(lang: Language = "th") {
  const { metrics, loading: metricsLoading } = useMetrics();
  const policies = useLiveQuery(() => db.insurancePolicies.toArray(), [], [] as InsurancePolicy[]);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], [] as Liability[]);
  const loading = metricsLoading || policies === undefined || liabilities === undefined;

  if (loading) {
    return {
      policies: [] as InsurancePolicy[], liabilities: [] as Liability[], checks: [] as InsuranceCheck[], passCount: 0, total: 4,
      expiringPolicies: [] as InsurancePolicy[], noBeneficiaryPolicies: [] as InsurancePolicy[],
      unlinkedCreditLife: [] as InsurancePolicy[], loading: true,
    };
  }

  const checks = computeInsuranceChecks(metrics, policies, liabilities, lang);
  const passCount = checks.filter((c) => c.status === "pass").length;

  return {
    policies,
    liabilities,
    checks,
    passCount,
    total: checks.length,
    expiringPolicies: findExpiringPolicies(policies),
    noBeneficiaryPolicies: findPoliciesWithoutBeneficiary(policies),
    unlinkedCreditLife: findUnlinkedCreditLife(policies, liabilities),
    loading: false,
  };
}
