"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { LIABILITY_COLOR } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, fillText } from "@/lib/i18n";
import { SectionHeader, Field, AddButton, Modal, Group, Row, cancelButtonStyle, formColumnStyle, formActionsStyle, fullInputStyle, formPairStyle, formPairCellStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { Liability, LiabilityTerm } from "@/lib/types";

const emptyForm = { term: "LongTerm" as LiabilityTerm, type: "", balance: "", rate: "", monthly: "" };

const debtIcon = <span style={{ width: 30, height: 30, borderRadius: 10, background: LIABILITY_COLOR, flexShrink: 0 }} />;

export function LiabilityTab() {
  const { t } = useLanguage();
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // The rate stays on the name line, where it has always been. The monthly
  // payment goes below it — it was being captured in the form and then shown
  // nowhere at all.
  const rowLeft = (l: Liability) => (
    <div>
      <div style={{ fontSize: 14 }}>{l.type} · {l.rate}%{t(TR.assets.perYear)}</div>
      {l.monthly > 0 && (
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          {fillText(t(TR.assets.installmentPerMonth), { amount: fmt(l.monthly) })}
        </div>
      )}
    </div>
  );

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
        <div style={formColumnStyle}>
          <Field label={t(TR.assets.term)}>
            <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value as LiabilityTerm })} style={fullInputStyle}>
              <option value="ShortTerm">{t(TR.assets.shortTerm)}</option>
              <option value="LongTerm">{t(TR.assets.longTerm)}</option>
            </select>
          </Field>
          <Field label={t(TR.assets.debtType)}><input style={fullInputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t(TR.assets.debtTypePlaceholder)} /></Field>
          <Field label={t(TR.assets.balance)}><CalcInput value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} placeholder="0" /></Field>
          {/* The only pair in any of these forms: two short numbers about
              the same debt that are read together. */}
          <div style={formPairStyle}>
            <div style={formPairCellStyle}>
              <Field label={t(TR.assets.ratePerYear)}><input type="number" style={fullInputStyle} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="0" /></Field>
            </div>
            <div style={formPairCellStyle}>
              <Field label={t(TR.assets.monthlyPayment)}><CalcInput value={form.monthly} onChange={(v) => setForm({ ...form, monthly: v })} placeholder="0" /></Field>
            </div>
          </div>
          <div style={formActionsStyle}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      <Group title={t(TR.assets.shortTermDebt)} amount={fmt(short.reduce((s, l) => s + l.balance, 0))} tint="#FFEFEA">
        {short.map((l) => <Row key={l.id} icon={debtIcon} left={rowLeft(l)} right={fmt(l.balance)} onClick={() => openEdit(l)} onDelete={() => remove(l.id)} />)}
      </Group>
      <Group title={t(TR.assets.longTermDebt)} amount={fmt(long.reduce((s, l) => s + l.balance, 0))} tint="#EFFBF6">
        {long.map((l) => <Row key={l.id} icon={debtIcon} left={rowLeft(l)} right={fmt(l.balance)} onClick={() => openEdit(l)} onDelete={() => remove(l.id)} />)}
      </Group>

      <AddFab onClick={openNew} />
    </div>
  );
}
