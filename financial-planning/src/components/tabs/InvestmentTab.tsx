"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { CATS, catInfo } from "@/lib/constants";
import { SectionHeader, EmptyState, Field, AddButton, Modal, Row, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { InvestmentAsset, InvestmentCategory } from "@/lib/types";

const emptyForm = { category: "Equity" as InvestmentCategory, name: "", current_value: "", goal_id: "" };

export function InvestmentTab() {
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

  return (
    <div>
      <SectionHeader title="สินทรัพย์เพื่อการลงทุน 📈" sub="กองทุนรวม หุ้น อสังหาริมทรัพย์ ทองคำ และสินทรัพย์ทางเลือก" />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "แก้ไขสินทรัพย์เพื่อการลงทุน" : "เพิ่มสินทรัพย์เพื่อการลงทุน"}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="ประเภท">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as InvestmentCategory })}
              style={inputStyle}
            >
              {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="ชื่อสินทรัพย์"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น TSLA80X" /></Field>
          <Field label="มูลค่าปัจจุบัน"><CalcInput value={form.current_value} onChange={(v) => setForm({ ...form, current_value: v })} placeholder="0" /></Field>
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

      <div className="fp-card" style={{ padding: 10 }}>
        {investment && investment.length ? investment.map((a) => (
          <Row
            key={a.id}
            icon={<span style={{ width: 30, height: 30, borderRadius: 10, background: catInfo(a.category).color, flexShrink: 0 }} />}
            left={
              <div>
                <div style={{ fontSize: 13.5 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{catInfo(a.category).label} · สภาพคล่อง{a.liquidity} {a.goal_id ? "· " + ((goals || []).find((g) => g.id === a.goal_id)?.name || "") : ""}</div>
              </div>
            }
            right={fmt(a.current_value)}
            onClick={() => openEdit(a)}
            onDelete={() => remove(a.id)}
          />
        )) : <EmptyState text="ยังไม่มีสินทรัพย์เพื่อการลงทุน" />}
      </div>

      <AddFab onClick={openNew} />
    </div>
  );
}
