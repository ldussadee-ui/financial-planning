"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { SectionHeader, Field, AddButton, Modal, Group, Row, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { Liability, LiabilityTerm } from "@/lib/types";

const emptyForm = { term: "LongTerm" as LiabilityTerm, type: "", balance: "", rate: "", monthly: "" };

export function LiabilityTab() {
  const { t } = useLanguage();
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (l: Liability) => {
    setForm({ term: l.term, type: l.type, balance: String(l.balance), rate: String(l.rate), monthly: String(l.monthly) });
    setEditingId(l.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.type || !form.balance) return;
    void db.liabilities.put({
      id: editingId || uid(), term: form.term, type: form.type,
      balance: Number(form.balance), rate: Number(form.rate || 0),
      monthly: Number(form.monthly || 0),
    });
    closeModal();
  };
  const remove = (id: string) => void db.liabilities.delete(id);

  const short = (liabilities || []).filter((l) => l.term === "ShortTerm");
  const long = (liabilities || []).filter((l) => l.term === "LongTerm");

  return (
    <div>
      <SectionHeader title={t(TR.assets.liabilityTitle)} sub={t(TR.assets.liabilitySub)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.assets.liabilityEditTitle) : t(TR.assets.liabilityAddTitle)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.assets.term)}>
            <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value as LiabilityTerm })} style={inputStyle}>
              <option value="ShortTerm">{t(TR.assets.shortTerm)}</option>
              <option value="LongTerm">{t(TR.assets.longTerm)}</option>
            </select>
          </Field>
          <Field label={t(TR.assets.debtType)}><input style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t(TR.assets.debtTypePlaceholder)} /></Field>
          <Field label={t(TR.assets.balance)}><CalcInput value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} placeholder="0" /></Field>
          <Field label={t(TR.assets.ratePerYear)}><input type="number" style={inputStyle} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="0" /></Field>
          <Field label={t(TR.assets.monthlyPayment)}><CalcInput value={form.monthly} onChange={(v) => setForm({ ...form, monthly: v })} placeholder="0" /></Field>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      <Group title={t(TR.assets.shortTermDebt)} amount={fmt(short.reduce((s, l) => s + l.balance, 0))} tint="#FFEFEA">
        {short.map((l) => <Row key={l.id} left={`${l.type} · ${l.rate}%${t(TR.assets.perYear)}`} right={fmt(l.balance)} onClick={() => openEdit(l)} onDelete={() => remove(l.id)} />)}
      </Group>
      <Group title={t(TR.assets.longTermDebt)} amount={fmt(long.reduce((s, l) => s + l.balance, 0))} tint="#EFFBF6">
        {long.map((l) => <Row key={l.id} left={`${l.type} · ${l.rate}%${t(TR.assets.perYear)}`} right={fmt(l.balance)} onClick={() => openEdit(l)} onDelete={() => remove(l.id)} />)}
      </Group>

      <AddFab onClick={openNew} />
    </div>
  );
}
