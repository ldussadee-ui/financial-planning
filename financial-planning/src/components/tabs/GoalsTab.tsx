"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, recommendedMonthlySavings, uid } from "@/lib/calc";
import { GOAL_TYPES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, GOAL_TYPE_LABEL_EN, LEVEL_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, EmptyState, Field, AddButton, Modal, cancelButtonStyle, inputStyle, deleteBtn } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { Goal, GoalType, Priority } from "@/lib/types";

const emptyForm = { type: "เกษียณ" as GoalType, name: "", target: "", date: "", priority: "กลาง" as Priority, expectedReturn: "" };

export function GoalsTab() {
  const { lang, t } = useLanguage();
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (g: Goal) => {
    setForm({ type: g.type, name: g.name, target: String(g.target), date: g.date, priority: g.priority, expectedReturn: g.expectedReturn ? String(g.expectedReturn) : "" });
    setEditingId(g.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.name || !form.target) return;
    void db.goals.put({
      id: editingId || uid(), type: form.type, name: form.name,
      target: Number(form.target), date: form.date, priority: form.priority,
      expectedReturn: Number(form.expectedReturn || 0),
    });
    closeModal();
  };
  const remove = (id: string) => void db.goals.delete(id);

  return (
    <div>
      <SectionHeader title={t(TR.goals.title)} sub={t(TR.goals.subtitle)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.goals.editTitle) : t(TR.goals.addTitle)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.goals.goalType)}>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GoalType })} style={inputStyle}>
              {GOAL_TYPES.map((gt) => <option key={gt} value={gt}>{translateLabel(gt, lang, GOAL_TYPE_LABEL_EN)}</option>)}
            </select>
          </Field>
          <Field label={t(TR.goals.goalName)}><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t(TR.goals.goalNamePlaceholder)} /></Field>
          <Field label={t(TR.goals.targetAmount)}><CalcInput value={form.target} onChange={(v) => setForm({ ...form, target: v })} placeholder="0" /></Field>
          <Field label={t(TR.goals.targetDate)}><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label={t(TR.goals.priority)}>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} style={inputStyle}>
              <option value="สูง">{translateLabel("สูง", lang, LEVEL_LABEL_EN)}</option>
              <option value="กลาง">{translateLabel("กลาง", lang, LEVEL_LABEL_EN)}</option>
              <option value="ต่ำ">{translateLabel("ต่ำ", lang, LEVEL_LABEL_EN)}</option>
            </select>
          </Field>
          <Field label={t(TR.goals.expectedReturn)}>
            <input type="number" style={inputStyle} value={form.expectedReturn} onChange={(e) => setForm({ ...form, expectedReturn: e.target.value })} placeholder="0" />
          </Field>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      <div className="fp-card" style={{ padding: 10 }}>
        {goals && goals.length ? goals.map((g) => {
          const linked =
            (investment || []).filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0) +
            (liquid || []).filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0);
          const pct = Math.min(100, (linked / g.target) * 100);
          const monthlyNeeded = recommendedMonthlySavings(g, linked);
          return (
            <div key={g.id} style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => openEdit(g)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {translateLabel(g.type, lang, GOAL_TYPE_LABEL_EN)} · {t(TR.goals.priorityWord)}{translateLabel(g.priority, lang, LEVEL_LABEL_EN)} {g.date ? `${t(TR.goals.dueDate)} ${g.date}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="fp-num" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{fmt(linked)} / {fmt(g.target)}</span>
                  <span className="fp-num" style={{ fontSize: 13, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                  <span style={{ color: "var(--ink-soft)" }} aria-hidden><Pencil size={12} /></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t(TR.goals.deleteConfirm))) remove(g.id);
                    }}
                    style={deleteBtn}
                    aria-label={t(TR.goals.deleteAria)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ height: 8, background: "#FBF2FF", borderRadius: 999, overflow: "hidden", marginTop: 9 }}>
                <div style={{ width: pct + "%", height: "100%", background: "#D4577E", borderRadius: 999 }} />
              </div>
              {monthlyNeeded !== null ? (
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                  {t(TR.goals.recommendedSavings)} {fmt(monthlyNeeded)}{t(TR.goals.perMonthToMakeIt)}
                  {g.expectedReturn ? ` ${t(TR.goals.assumedReturn)} ${g.expectedReturn}${t(TR.goals.perYearEstimate)}` : ` ${t(TR.goals.noInvestmentReturn)}`}
                </div>
              ) : !g.date ? (
                <div style={{ fontSize: 12, color: "#D07A4E", marginTop: 6 }}>{t(TR.goals.setDateForAdvice)}</div>
              ) : (
                <div style={{ fontSize: 12, color: "#D07A4E", marginTop: 6 }}>{t(TR.goals.datePassedOrTooClose)}</div>
              )}
            </div>
          );
        }) : <EmptyState text={t(TR.goals.empty)} />}
      </div>

      <AddFab onClick={openNew} />
    </div>
  );
}
