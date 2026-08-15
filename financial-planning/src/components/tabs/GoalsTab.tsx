"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { GOAL_TYPES } from "@/lib/constants";
import { SectionHeader, EmptyState, Field, AddButton, Modal, cancelButtonStyle, inputStyle, deleteBtn } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { Goal, GoalType, Priority } from "@/lib/types";

const emptyForm = { type: "เกษียณ" as GoalType, name: "", target: "", date: "", priority: "กลาง" as Priority };

export function GoalsTab() {
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (g: Goal) => {
    setForm({ type: g.type, name: g.name, target: String(g.target), date: g.date, priority: g.priority });
    setEditingId(g.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.name || !form.target) return;
    void db.goals.put({
      id: editingId || uid(), type: form.type, name: form.name,
      target: Number(form.target), date: form.date, priority: form.priority,
    });
    closeModal();
  };
  const remove = (id: string) => void db.goals.delete(id);

  return (
    <div>
      <SectionHeader title="เป้าหมายทางการเงิน 🎯" sub="ผูกเป้าหมายกับสินทรัพย์เพื่อการลงทุนในแท็บก่อนหน้า" />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "แก้ไขเป้าหมาย" : "เพิ่มเป้าหมาย"}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="ประเภทเป้าหมาย">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GoalType })} style={inputStyle}>
              {GOAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="ชื่อเป้าหมาย"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น กองทุนเกษียณ" /></Field>
          <Field label="เป้าหมาย (บาท)"><CalcInput value={form.target} onChange={(v) => setForm({ ...form, target: v })} placeholder="0" /></Field>
          <Field label="วันที่เป้าหมาย"><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="ความสำคัญ">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} style={inputStyle}>
              <option>สูง</option><option>กลาง</option><option>ต่ำ</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>ยกเลิก</button>
            <AddButton onClick={submit} label={editingId ? "บันทึกการแก้ไข" : "เพิ่ม"} />
          </div>
        </div>
      </Modal>

      <div className="fp-card" style={{ padding: 10 }}>
        {goals && goals.length ? goals.map((g) => {
          const linked =
            (investment || []).filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0) +
            (liquid || []).filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0);
          const pct = Math.min(100, (linked / g.target) * 100);
          return (
            <div key={g.id} style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => openEdit(g)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5 }}>{g.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{g.type} · ความสำคัญ{g.priority} {g.date ? "· ครบกำหนด " + g.date : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="fp-num" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{fmt(linked)} / {fmt(g.target)}</span>
                  <span className="fp-num" style={{ fontSize: 13, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                  <span style={{ color: "var(--ink-soft)" }} aria-hidden><Pencil size={12} /></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("ลบเป้าหมายนี้ใช่หรือไม่?")) remove(g.id);
                    }}
                    style={deleteBtn}
                    aria-label="ลบเป้าหมาย"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ height: 8, background: "#FBF2FF", borderRadius: 999, overflow: "hidden", marginTop: 9 }}>
                <div style={{ width: pct + "%", height: "100%", background: "#D4577E", borderRadius: 999 }} />
              </div>
            </div>
          );
        }) : <EmptyState text="ยังไม่มีเป้าหมาย" />}
      </div>

      <AddFab onClick={openNew} />
    </div>
  );
}
