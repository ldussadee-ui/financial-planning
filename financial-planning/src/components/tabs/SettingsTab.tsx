"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt } from "@/lib/calc";
import { useHourlyWage } from "@/hooks/useHourlyWage";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { useBudgets } from "@/hooks/useBudgets";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, CATEGORY_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, Field, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { CashflowExportImport } from "./CashflowExportImport";
import { AssetExportImport } from "./AssetExportImport";
import pkg from "../../../package.json";

const syncButtonStyle = {
  border: "none", background: "#F5EFFF", color: "#7A5C9E",
  borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
} as const;

function SpendCompareSettings() {
  const { t } = useLanguage();
  const { hourlyWage, autoWage, setAutoWage, manualWage, setManualWage, computedWage } = useHourlyWage();
  const { goal, goals, primaryGoalId, setPrimaryGoalId } = usePrimaryGoal();

  return (
    <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
      <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 4 }}>{t(TR.settings.spendCompare)}</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
        {t(TR.settings.spendCompareNote)}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={autoWage} onChange={(e) => setAutoWage(e.target.checked)} />
        {t(TR.settings.autoWageLabel)}
      </label>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label={t(TR.settings.hourlyWage)}>
          {autoWage ? (
            <input readOnly value={hourlyWage || 0} style={{ ...inputStyle, background: "#F5F3EE", color: "var(--ink-soft)" }} />
          ) : (
            <CalcInput value={String(manualWage || "")} onChange={(v) => setManualWage(Number(v) || 0)} placeholder="0" />
          )}
        </Field>
        <Field label={t(TR.settings.primaryGoal)}>
          {goals.length ? (
            <select
              value={goal?.id || ""}
              onChange={(e) => setPrimaryGoalId(e.target.value || null)}
              style={inputStyle}
            >
              {!primaryGoalId && <option value="">{t(TR.settings.autoLabel)} {goal?.name} —</option>}
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t(TR.settings.noGoalsYet)}</div>
          )}
        </Field>
      </div>

      {!autoWage && computedWage > 0 && (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          {t(TR.settings.recommendedNow)} {fmt(computedWage)}{t(TR.settings.perHour)}
          <button type="button" onClick={() => setManualWage(computedWage)} style={syncButtonStyle}>{t(TR.settings.useThisValue)}</button>
        </div>
      )}
      {hourlyWage > 0 && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>{t(TR.settings.currentlyUsing)} {fmt(hourlyWage)}{t(TR.settings.perHourFull)}</div>}
    </div>
  );
}

function BudgetSettings() {
  const { lang, t } = useLanguage();
  const categories = useLiveQuery(() => db.categories.where("entryType").equals("Expense").sortBy("order"), [], []);
  const { map, setBudget } = useBudgets();
  const [open, setOpen] = useState(false);
  const summary = map.size > 0 ? `${t(TR.settings.budgetSetPrefix)} ${map.size} ${t(TR.settings.budgetSetCount)}` : t(TR.settings.budgetNotSet);

  return (
    <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
      <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {t(TR.settings.budgetTitle)}
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{summary}</span>
      </div>
      {open && (
        <>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "10px 0 14px" }}>
            {t(TR.settings.budgetNote)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(categories || []).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 22, textAlign: "center" }}>{c.icon}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{translateLabel(c.label, lang, CATEGORY_LABEL_EN)}</span>
                <div style={{ width: 130 }}>
                  <CalcInput value={String(map.get(c.label) || "")} onChange={(v) => setBudget(c.label, Number(v) || 0)} placeholder={t(TR.settings.budgetPlaceholder)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsTab() {
  const { t } = useLanguage();
  return (
    <div>
      <SectionHeader title={t(TR.settings.title)} sub={t(TR.settings.subtitle)} />

      <SpendCompareSettings />
      <BudgetSettings />

      <div className="fp-card" style={{ padding: 26, marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 4 }}>{t(TR.settings.cashflowSection)}</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
          {t(TR.settings.cashflowExportNote)}
        </div>
        <CashflowExportImport />
      </div>

      <div className="fp-card" style={{ padding: 26 }}>
        <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 4 }}>{t(TR.settings.assetsSection)}</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
          {t(TR.settings.assetsExportNote)}
        </div>
        <AssetExportImport />
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", marginTop: 18 }}>
        {t(TR.settings.version)} {pkg.version}
      </div>
    </div>
  );
}
