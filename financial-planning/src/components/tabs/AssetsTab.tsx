"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { LiquidTab } from "./LiquidTab";
import { InvestmentTab } from "./InvestmentTab";
import { PersonalTab } from "./PersonalTab";
import { LiabilityTab } from "./LiabilityTab";
import { AssetTrendTab } from "./AssetTrendTab";

type AssetCategory = "liquid" | "investment" | "personal" | "liability" | "trend";

export function AssetsTab() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<AssetCategory>("liquid");

  const CATEGORIES: { value: AssetCategory; label: string }[] = [
    { value: "liquid", label: t(TR.assets.tabLiquid) },
    { value: "investment", label: t(TR.assets.tabInvestment) },
    { value: "personal", label: t(TR.assets.tabPersonal) },
    { value: "liability", label: t(TR.assets.tabLiability) },
    { value: "trend", label: t(TR.assets.tabTrend) },
  ];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <SegmentedControl small options={CATEGORIES} value={category} onChange={setCategory} />
      </div>

      {category === "liquid" && <LiquidTab />}
      {category === "investment" && <InvestmentTab />}
      {category === "personal" && <PersonalTab />}
      {category === "liability" && <LiabilityTab />}
      {category === "trend" && <AssetTrendTab />}
    </div>
  );
}
