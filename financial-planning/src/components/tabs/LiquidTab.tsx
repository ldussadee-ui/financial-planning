"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { LIQUID_TYPES, LIQUID_COLOR } from "@/lib/constants";
import { SectionHeader, EmptyState, Field, AddButton, inputStyle, deleteBtn } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import type { LiquidType } from "@/lib/types";

export function LiquidTab() {
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const [form, setForm] = useState<{ type: LiquidType; name: string; current_value: string; goal_id: string }>({
    type: "บัญชีออมทรัพย์", name: "", current_value: "", goal_id: "",
  });

  const add = () => {
    if (!form.name || !form.current_value) return;
    void db.liquidAssets.add({
      id: uid(), type: form.type, name: form.name,
      current_value: Number(form.current_value), goal_id: form.goal_id || null,
    });
    setForm({ ...form, name: "", current_value: "" });
  };
  const remove = (id: string) => void db.liquidAssets.delete(id);

  return (
    <div>
      <SectionHeader title="สินทรัพย์สภาพคล่อง 🐷" sub="เงินสด บัญชีออมทรัพย์ และเงินที่พร้อมใช้ได้ทันที — แยกจากสินทรัพย์เพื่อการลงทุน" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ประเภท">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LiquidType })} style={inputStyle}>
            {LIQUID_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="ชื่อรายการ"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น บัญชีออมทรัพย์สำรอง" /></Field>
        <Field label="จำนวนเงิน"><CalcInput value={form.current_value} onChange={(v) => setForm({ ...form, current_value: v })} placeholder="0" /></Field>
        <Field label="ผูกเป้าหมาย">
          <select value={form.goal_id} onChange={(e) => setForm({ ...form, goal_id: e.target.value })} style={inputStyle}>
            <option value="">— ไม่ระบุ —</option>
            {(goals || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        <AddButton onClick={add} />
      </div>
      <div className="fp-card" style={{ padding: 10 }}>
        {liquid && liquid.length ? liquid.map((a) => (
          <div key={a.id} className="fp-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: LIQUID_COLOR, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{a.type} {a.goal_id ? "· " + ((goals || []).find((g) => g.id === a.goal_id)?.name || "") : ""}</div>
            </div>
            <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(a.current_value)}</span>
            <button type="button" onClick={() => remove(a.id)} style={deleteBtn} aria-label="ลบรายการ"><Trash2 size={14} /></button>
          </div>
        )) : <EmptyState text="ยังไม่มีสินทรัพย์สภาพคล่อง" />}
      </div>
    </div>
  );
}
