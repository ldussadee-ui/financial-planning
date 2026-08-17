"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { LIQUID_TYPES, LIQUID_COLOR } from "@/lib/constants";
import { SectionHeader, EmptyState, Field, AddButton, Modal, Group, Row, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { LiquidAsset, LiquidType } from "@/lib/types";

const emptyForm = { type: "บัญชีออมทรัพย์" as LiquidType, name: "", current_value: "", goal_id: "" };

export function LiquidTab() {
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (a: LiquidAsset) => {
    setForm({ type: a.type, name: a.name, current_value: String(a.current_value), goal_id: a.goal_id || "" });
    setEditingId(a.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.name || !form.current_value) return;
    void db.liquidAssets.put({
      id: editingId || uid(), type: form.type, name: form.name,
      current_value: Number(form.current_value), goal_id: form.goal_id || null,
    });
    closeModal();
  };
  const remove = (id: string) => void db.liquidAssets.delete(id);

  const grouped = LIQUID_TYPES.map((t) => ({
    type: t,
    items: (liquid || []).filter((a) => a.type === t),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <SectionHeader title="สินทรัพย์สภาพคล่อง 🐷" sub="เงินสด บัญชีออมทรัพย์ และเงินที่พร้อมใช้ได้ทันที — แยกจากสินทรัพย์เพื่อการลงทุน" />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "แก้ไขสินทรัพย์สภาพคล่อง" : "เพิ่มสินทรัพย์สภาพคล่อง"}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
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
              icon={<span style={{ width: 30, height: 30, borderRadius: 10, background: LIQUID_COLOR, flexShrink: 0 }} />}
              left={
                <div>
                  <div style={{ fontSize: 14 }}>{a.name}</div>
                  {a.goal_id && (
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{(goals || []).find((g2) => g2.id === a.goal_id)?.name || ""}</div>
                  )}
                </div>
              }
              right={fmt(a.current_value)}
              onClick={() => openEdit(a)}
              onDelete={() => remove(a.id)}
            />
          ))}
        </Group>
      )) : <EmptyState text="ยังไม่มีสินทรัพย์สภาพคล่อง" />}

      <AddFab onClick={openNew} />
    </div>
  );
}
