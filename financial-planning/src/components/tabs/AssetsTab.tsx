"use client";

import { useState, type CSSProperties } from "react";
import { LiquidTab } from "./LiquidTab";
import { InvestmentTab } from "./InvestmentTab";
import { PersonalTab } from "./PersonalTab";
import { LiabilityTab } from "./LiabilityTab";

type AssetCategory = "liquid" | "investment" | "personal" | "liability";

const CATEGORIES: { key: AssetCategory; label: string }[] = [
  { key: "liquid", label: "สภาพคล่อง" },
  { key: "investment", label: "เพื่อการลงทุน" },
  { key: "personal", label: "ส่วนตัว" },
  { key: "liability", label: "หนี้สิน" },
];

function toggleStyle(active: boolean): CSSProperties {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "#7FD1C9" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36,
  };
}

export function AssetsTab() {
  const [category, setCategory] = useState<AssetCategory>("liquid");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" onClick={() => setCategory(c.key)} style={toggleStyle(category === c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {category === "liquid" && <LiquidTab />}
      {category === "investment" && <InvestmentTab />}
      {category === "personal" && <PersonalTab />}
      {category === "liability" && <LiabilityTab />}
    </div>
  );
}
