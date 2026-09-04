"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { CATS, catInfo } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, INVESTMENT_CAT_LABEL_EN, LEVEL_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, EmptyState, Field, AddButton, Modal, Group, Row, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { InvestmentAsset, InvestmentCategory } from "@/lib/types";

const emptyForm = { category: "Equity" as InvestmentCategory, name: "", current_value: "", goal_id: "" };

export function InvestmentTab() {
  const { lang, t } = useLanguage();
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (a: InvestmentAsset) => {
    setForm({ category: a.category, name: a.name, current_value: String(a.current_value), goal_id: a.goal_id || "" });
    setEditingId(a.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.name || !form.current_value) return;
    void db.investmentAssets.put({
      id: editingId || uid(), category: form.category, name: form.name,
      current_value: Number(form.current_value),
      liquidity: catInfo(form.category).liquidity, goal_id: form.goal_id || null,
    });
    closeModal();
  };
  const remove = (id: string) => void db.investmentAssets.delete(id);

  const grouped = CATS.map((c) => ({
    cat: c,
    items: (investment || []).filter((a) => a.category === c.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <SectionHeader title={t(TR.assets.investTitle)} sub={t(TR.assets.investSub)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.assets.investEditTitle) : t(TR.assets.investAddTitle)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.common.type)}>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as InvestmentCategory })}
              style={inputStyle}
            >
              {CATS.map((c) => <option key={c.key} value={c.key}>{translateLabel(c.label, lang, INVESTMENT_CAT_LABEL_EN)}</option>)}
            </select>
          </Field>
          <Field label={t(TR.assets.assetName)}><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. TSLA80X" /></Field>
          <Field label={t(TR.common.currentValue)}><CalcInput value={form.current_value} onChange={(v) => setForm({ ...form, current_value: v })} placeholder="0" /></Field>
          <Field label={t(TR.common.linkedGoal)}>
            <select value={form.goal_id} onChange={(e) => setForm({ ...form, goal_id: e.target.value })} style={inputStyle}>
              <option value="">{t(TR.common.notSpecified)}</option>
              {(goals || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      {grouped.length ? grouped.map((g) => (
        <Group key={g.cat.key} title={translateLabel(g.cat.label, lang, INVESTMENT_CAT_LABEL_EN)} amount={fmt(g.items.reduce((s, a) => s + a.current_value, 0))} tint="#FBF7F2">
          {g.items.map((a) => (
            <Row
              key={a.id}
              icon={<span style={{ width: 30, height: 30, borderRadius: 10, background: g.cat.color, flexShrink: 0 }} />}
              left={
                <div>
                  <div style={{ fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {t(TR.assets.liquidity)}{translateLabel(a.liquidity, lang, LEVEL_LABEL_EN)} {a.goal_id ? "· " + ((goals || []).find((g2) => g2.id === a.goal_id)?.name || "") : ""}
                  </div>
                </div>
              }
              right={fmt(a.current_value)}
              onClick={() => openEdit(a)}
              onDelete={() => remove(a.id)}
            />
          ))}
        </Group>
      )) : <EmptyState text={t(TR.assets.investEmpty)} />}

      <AddFab onClick={openNew} />
    </div>
  );
}
