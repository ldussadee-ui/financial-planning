"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { PERSONAL_TYPES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, PERSONAL_TYPE_LABEL_EN, translateLabel } from "@/lib/i18n";
import { SectionHeader, EmptyState, Field, AddButton, Modal, Group, Row, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { PersonalAsset, PersonalItemType } from "@/lib/types";

const emptyForm = { item_type: "รถยนต์" as PersonalItemType, name: "", current_value: "", liability_id: "" };

export function PersonalTab() {
  const { lang, t } = useLanguage();
  const personal = useLiveQuery(() => db.personalAssets.toArray(), [], []);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (a: PersonalAsset) => {
    setForm({ item_type: a.item_type, name: a.name, current_value: String(a.current_value), liability_id: a.liability_id || "" });
    setEditingId(a.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.name || !form.current_value) return;
    void db.personalAssets.put({
      id: editingId || uid(), item_type: form.item_type, name: form.name,
      current_value: Number(form.current_value), liability_id: form.liability_id || null,
    });
    closeModal();
  };
  const remove = (id: string) => void db.personalAssets.delete(id);

  const grouped = PERSONAL_TYPES.map((t) => ({
    type: t,
    items: (personal || []).filter((a) => a.item_type === t),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <SectionHeader title={t(TR.assets.personalTitle)} sub={t(TR.assets.personalSub)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.assets.personalEditTitle) : t(TR.assets.personalAddTitle)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.common.type)}>
            <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as PersonalItemType })} style={inputStyle}>
              {PERSONAL_TYPES.map((pt) => <option key={pt} value={pt}>{translateLabel(pt, lang, PERSONAL_TYPE_LABEL_EN)}</option>)}
            </select>
          </Field>
          <Field label={t(TR.common.name)}><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Honda City" /></Field>
          <Field label={t(TR.common.currentValue)}><CalcInput value={form.current_value} onChange={(v) => setForm({ ...form, current_value: v })} placeholder="0" /></Field>
          <Field label={t(TR.assets.linkedLiability)}>
            <select value={form.liability_id} onChange={(e) => setForm({ ...form, liability_id: e.target.value })} style={inputStyle}>
              <option value="">{t(TR.common.none)}</option>
              {(liabilities || []).map((l) => <option key={l.id} value={l.id}>{l.type}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      {grouped.length ? grouped.map((g) => (
        <Group key={g.type} title={translateLabel(g.type, lang, PERSONAL_TYPE_LABEL_EN)} amount={fmt(g.items.reduce((s, a) => s + a.current_value, 0))} tint="#FBF7F2">
          {g.items.map((a) => (
            <Row
              key={a.id}
              left={
                <div>
                  <div style={{ fontSize: 14 }}>{a.name}</div>
                  {a.liability_id && (
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t(TR.assets.linkedWith)} {(liabilities || []).find((l) => l.id === a.liability_id)?.type || ""}</div>
                  )}
                </div>
              }
              right={fmt(a.current_value)}
              onClick={() => openEdit(a)}
              onDelete={() => remove(a.id)}
            />
          ))}
        </Group>
      )) : <EmptyState text={t(TR.assets.personalEmpty)} />}

      <AddFab onClick={openNew} />
    </div>
  );
}
