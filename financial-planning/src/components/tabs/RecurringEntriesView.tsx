"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt } from "@/lib/calc";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, CATEGORY_LABEL_EN, PAYMENT_METHOD_LABEL_EN, translateLabel } from "@/lib/i18n";
import {
  SectionHeader, EmptyState, Field, Modal, Row, SegmentedControl, DayPicker,
  cancelButtonStyle, inputStyle,
} from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import type { CashFlowType, RecurringEntry } from "@/lib/types";

export function RecurringEntriesView() {
  const { lang, t } = useLanguage();
  const rules = useLiveQuery(() => db.recurringEntries.toArray(), [], [] as RecurringEntry[]);
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray(), [], []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ type: CashFlowType; category: string; amount: string; dayOfMonth: number; shiftWeekend: boolean; payment_method_id: string }>({
    type: "Income", category: "", amount: "", dayOfMonth: 1, shiftWeekend: false, payment_method_id: "",
  });

  const openEdit = (rule: RecurringEntry) => {
    setForm({
      type: rule.type, category: rule.category, amount: String(rule.amount),
      dayOfMonth: rule.dayOfMonth, shiftWeekend: rule.shiftWeekend, payment_method_id: rule.payment_method_id || "",
    });
    setEditingId(rule.id);
  };
  const closeModal = () => setEditingId(null);

  const submit = () => {
    if (!editingId || !form.category || !form.amount) return;
    void db.recurringEntries.update(editingId, {
      type: form.type, category: form.category, amount: Number(form.amount),
      dayOfMonth: form.dayOfMonth, shiftWeekend: form.shiftWeekend,
      payment_method_id: form.type === "Expense" ? (form.payment_method_id || null) : null,
    });
    closeModal();
  };

  const remove = (id: string) => void db.recurringEntries.delete(id);
  const setActive = (id: string, active: boolean) => void db.recurringEntries.update(id, { active });

  return (
    <div>
      <Link
        href="/cashflow"
        aria-label={t(TR.ratios.backToOverview)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%",
          background: "#F5EFFF", color: "#7A5C9E", marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} />
      </Link>
      <SectionHeader title={t(TR.recurring.pageTitle)} sub={t(TR.recurring.pageSubtitle)} />

      <Modal open={editingId !== null} onClose={closeModal} title={t(TR.recurring.editTitle)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.common.type)}>
            <SegmentedControl
              small
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[
                { value: "Income", label: t(TR.cashflow.income) },
                { value: "Expense", label: t(TR.cashflow.expense) },
              ]}
            />
          </Field>
          <Field label={t(TR.cashflow.category)}>
            <input style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label={t(TR.common.amount)}><CalcInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="0" /></Field>
          <Field label={t(TR.cashflow.date)}>
            <DayPicker
              value={form.dayOfMonth}
              onChange={(d) => setForm({ ...form, dayOfMonth: d })}
              shiftWeekend={form.shiftWeekend}
              onShiftWeekendChange={(v) => setForm({ ...form, shiftWeekend: v })}
              buttonLabel={t(TR.recurring.dayButtonLabel)}
              popoverTitle={t(TR.recurring.chooseDay)}
              maxDay={31}
            />
          </Field>
          {form.type === "Expense" && (
            <Field label={t(TR.cashflow.paidWith)}>
              <select style={inputStyle} value={form.payment_method_id} onChange={(e) => setForm({ ...form, payment_method_id: e.target.value })}>
                <option value="">—</option>
                {(paymentMethods || []).map((m) => (
                  <option key={m.id} value={m.id}>{translateLabel(m.name, lang, PAYMENT_METHOD_LABEL_EN)}</option>
                ))}
              </select>
            </Field>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <button
              type="button"
              onClick={submit}
              style={{ background: "#0F6E56", color: "#fff", border: "none", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {t(TR.common.saveEdit)}
            </button>
          </div>
        </div>
      </Modal>

      <div className="fp-card" style={{ padding: 10 }}>
        {(rules || []).length ? rules!.map((r) => (
          <Row
            key={r.id}
            left={
              <div style={{ opacity: r.active ? 1 : 0.5 }}>
                <div style={{ fontSize: 14 }}>{translateLabel(r.category, lang, CATEGORY_LABEL_EN)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t(TR.recurring.everyDayOf)} {r.dayOfMonth}</div>
              </div>
            }
            right={fmt(r.amount) + t(TR.recurring.perMonth)}
            onClick={() => openEdit(r)}
            onDelete={() => remove(r.id)}
            deleteConfirmText={t(TR.recurring.deleteConfirm)}
            deleteAriaLabel={t(TR.recurring.deleteAria)}
            toggle={{ checked: r.active, onChange: (v) => setActive(r.id, v), ariaLabel: t(TR.recurring.activeAria) }}
          />
        )) : <EmptyState text={t(TR.recurring.empty)} />}
      </div>
    </div>
  );
}
