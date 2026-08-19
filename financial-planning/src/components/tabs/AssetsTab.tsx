"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui";
import { LiquidTab } from "./LiquidTab";
import { InvestmentTab } from "./InvestmentTab";
import { PersonalTab } from "./PersonalTab";
import { LiabilityTab } from "./LiabilityTab";
import { AssetTrendTab } from "./AssetTrendTab";

type AssetCategory = "liquid" | "investment" | "personal" | "liability" | "trend";

const CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: "liquid", label: "สภาพคล่อง" },
  { value: "investment", label: "ลงทุน" },
  { value: "personal", label: "ส่วนตัว" },
  { value: "liability", label: "หนี้สิน" },
  { value: "trend", label: "แนวโน้ม" },
];

export function AssetsTab() {
  const [category, setCategory] = useState<AssetCategory>("liquid");

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
