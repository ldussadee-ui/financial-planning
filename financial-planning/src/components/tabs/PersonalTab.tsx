"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { PERSONAL_TYPES } from "@/lib/constants";
import { SectionHeader, EmptyState, Field, AddButton, Modal, Group, Row, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { PersonalAsset, PersonalItemType } from "@/lib/types";

const emptyForm = { item_type: "รถยนต์" as PersonalItemType, name: "", current_value: "", liability_id: "" };

export function PersonalTab() {
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
      <SectionHeader title="สินทรัพย์ส่วนตัว 🚗" sub="ทรัพย์สินที่ใช้งาน ไม่ก่อให้เกิดรายได้ — นับใน Total Net Worth เท่านั้น" />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "แก้ไขสินทรัพย์ส่วนตัว" : "เพิ่มสินทรัพย์ส่วนตัว"}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="ประเภท">
            <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as PersonalItemType })} style={inputStyle}>
              {PERSONAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="ชื่อ"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Honda City" /></Field>
          <Field label="มูลค่าปัจจุบัน"><CalcInput value={form.current_value} onChange={(v) => setForm({ ...form, current_value: v })} placeholder="0" /></Field>
          <Field label="หนี้สินที่ผูกอยู่">
            <select value={form.liability_id} onChange={(e) => setForm({ ...form, liability_id: e.target.value })} style={inputStyle}>
              <option value="">— ไม่มี —</option>
              {(liabilities || []).map((l) => <option key={l.id} value={l.id}>{l.type}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>ยกเลิก</button>
            <AddButton onClick={submit} label={editingId ? "บันทึกการแก้ไข" : "เพิ่ม"} />
          </div>
        </div>
      </Modal>

      {grouped.length ? grouped.map((g) => (
        <Group key={g.type} title={`${g.type} — ${fmt(g.items.reduce((s, a) => s + a.current_value, 0))}`} tint="#FBF7F2">
          {g.items.map((a) => (
            <Row
              key={a.id}
              left={
                <div>
                  <div style={{ fontSize: 14 }}>{a.name}</div>
                  {a.liability_id && (
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>ผูกกับ {(liabilities || []).find((l) => l.id === a.liability_id)?.type || ""}</div>
                  )}
                </div>
              }
              right={fmt(a.current_value)}
              onClick={() => openEdit(a)}
              onDelete={() => remove(a.id)}
            />
          ))}
        </Group>
      )) : <EmptyState text="ยังไม่มีสินทรัพย์ส่วนตัว" />}

      <AddFab onClick={openNew} />
    </div>
  );
}
