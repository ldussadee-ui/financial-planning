"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { PERSONAL_TYPES } from "@/lib/constants";
import { SectionHeader, EmptyState, Field, AddButton, inputStyle, deleteBtn } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import type { PersonalItemType } from "@/lib/types";

export function PersonalTab() {
  const personal = useLiveQuery(() => db.personalAssets.toArray(), [], []);
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const [form, setForm] = useState<{ item_type: PersonalItemType; name: string; current_value: string; liability_id: string }>({
    item_type: "รถยนต์", name: "", current_value: "", liability_id: "",
  });

  const add = () => {
    if (!form.name || !form.current_value) return;
    void db.personalAssets.add({
      id: uid(), item_type: form.item_type, name: form.name,
      current_value: Number(form.current_value), liability_id: form.liability_id || null,
    });
    setForm({ ...form, name: "", current_value: "" });
  };
  const remove = (id: string) => void db.personalAssets.delete(id);

  return (
    <div>
      <SectionHeader title="สินทรัพย์ส่วนตัว 🚗" sub="ทรัพย์สินที่ใช้งาน ไม่ก่อให้เกิดรายได้ — นับใน Total Net Worth เท่านั้น" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
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
        <AddButton onClick={add} />
      </div>
      <div className="fp-card" style={{ padding: 10 }}>
        {personal && personal.length ? personal.map((a) => (
          <div key={a.id} className="fp-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{a.item_type}{a.liability_id ? " · ผูกกับ " + ((liabilities || []).find((l) => l.id === a.liability_id)?.type || "") : ""}</div>
            </div>
            <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(a.current_value)}</span>
            <button type="button" onClick={() => remove(a.id)} style={deleteBtn} aria-label="ลบรายการ"><Trash2 size={14} /></button>
          </div>
        )) : <EmptyState text="ยังไม่มีสินทรัพย์ส่วนตัว" />}
      </div>
    </div>
  );
}
