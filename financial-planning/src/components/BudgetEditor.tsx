"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useBudgets } from "@/hooks/useBudgets";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, CATEGORY_LABEL_EN, translateLabel } from "@/lib/i18n";
import { Modal } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";

// One editor, two homes: Settings expands it inline where it has always
// lived, and the cashflow tab opens it in a sheet from beside the bars it
// controls. Sharing the fields rather than duplicating them keeps the two
// from drifting apart as categories change.
export function BudgetFields() {
  const { lang, t } = useLanguage();
  const categories = useLiveQuery(() => db.categories.where("entryType").equals("Expense").sortBy("order"), [], []);
  const { map, setBudget } = useBudgets();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {(categories || []).map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 22, textAlign: "center" }}>{c.icon}</span>
          <span style={{ flex: 1, fontSize: 13, minWidth: 0 }}>{translateLabel(c.label, lang, CATEGORY_LABEL_EN)}</span>
          <div style={{ width: 130, flexShrink: 0 }}>
            <CalcInput
              value={String(map.get(c.label) || "")}
              onChange={(v) => setBudget(c.label, Number(v) || 0)}
              placeholder={t(TR.settings.budgetPlaceholder)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BudgetEditorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <Modal open={open} onClose={onClose} title={t(TR.settings.budgetModalTitle)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          {t(TR.settings.budgetNote)}
        </div>
        <BudgetFields />
        {/* Every field writes as it changes, so this only dismisses — there
            is nothing left to save by the time it is pressed. */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none", background: "#7FD1C9", color: "#fff", borderRadius: 999,
              padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t(TR.common.done)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
