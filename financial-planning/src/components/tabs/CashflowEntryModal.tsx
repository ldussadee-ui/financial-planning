"use client";

import { createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { classifyExpense, classifyIncome, daysFasterToGoal, hoursOfWork, isoToday, uid } from "@/lib/calc";
import { useHourlyWage } from "@/hooks/useHourlyWage";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { Field, AddButton, Modal, cancelButtonStyle, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import type { CashFlowEntry, CashFlowType, CategoryChip } from "@/lib/types";

function chipStyle(active: boolean): CSSProperties {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "#7FD1C9" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
  };
}
const chipDeleteBadge: CSSProperties = {
  position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: 999,
  background: "#FF8C7A", color: "#fff", border: "2px solid #FFF8F1", fontSize: 11, lineHeight: "14px",
  textAlign: "center", padding: 0, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};
const doneButtonStyle: CSSProperties = {
  background: "#0F6E56", color: "#fff", border: "none",
  borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
function badgeLabel(type: CashFlowType, cls: string) {
  if (type === "Expense") {
    if (cls === "Fixed") return "🔒 ตรวจพบว่าเป็นรายจ่ายประจำ";
    if (cls === "Invest") return "🌱 ตรวจพบว่าเป็นรายจ่ายออมและลงทุน";
    return "🎈 ตรวจพบว่าเป็นรายจ่ายผันแปร";
  }
  return cls === "Passive" ? "🌿 ตรวจพบว่าเป็นรายรับ Passive" : "💪 ตรวจพบว่าเป็นรายรับ Active";
}
function badgeStyle(type: CashFlowType, cls: string): CSSProperties {
  const isSoft = (type === "Expense" && cls === "Fixed") || (type === "Income" && cls === "Passive");
  const isInvest = type === "Expense" && cls === "Invest";
  return {
    fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, height: 20,
    background: isInvest ? "#E1F5EE" : isSoft ? "#DDEFFB" : "#FFE3D6",
    color: isInvest ? "#0F6E56" : isSoft ? "#4E93B5" : "#D07A4E",
  };
}

interface CashflowEntryApi {
  openNew: (type: CashFlowType) => void;
  openEdit: (entry: CashFlowEntry) => void;
  editingId: string | null;
  closeModal: () => void;
}
const CashflowEntryCtx = createContext<CashflowEntryApi | null>(null);

export function useCashflowEntry() {
  const ctx = useContext(CashflowEntryCtx);
  if (!ctx) throw new Error("useCashflowEntry must be used within CashflowEntryProvider");
  return ctx;
}

// Owns the shared income/expense entry modal so it can be opened from the
// global FAB or from a row's edit tap on any tab, not just the cashflow page.
export function CashflowEntryProvider({ children }: { children: ReactNode }) {
  const allCategories = useLiveQuery(() => db.categories.orderBy("order").toArray(), [], []);
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray(), [], []);
  const paymentMethodsSorted = [...(paymentMethods || [])].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "เงินสด" ? -1 : 1));
  const defaultCashId = (paymentMethods || []).find((m) => m.kind === "เงินสด")?.id ?? null;
  const { hourlyWage } = useHourlyWage();
  const { goal: primaryGoal, linked: primaryGoalLinked } = usePrimaryGoal();

  const [form, setForm] = useState({ type: "Income" as CashFlowType, category: "", amount: "", date: isoToday(), payment_method_id: "" });
  const [customMode, setCustomMode] = useState(false);
  const [saveShortcut, setSaveShortcut] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<CashFlowType | null>(null);
  const effectivePaymentMethodId = form.payment_method_id || defaultCashId || "";

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const dragFrom = useRef<number | null>(null);

  const preview = form.type === "Expense" ? classifyExpense(form.category) : classifyIncome(form.category);
  const cats = (allCategories || []).filter((c) => c.entryType === form.type);

  const amountNum = Number(form.amount || 0);
  const spendCompare = form.type === "Expense" && amountNum > 0
    ? (() => {
        const parts: string[] = [];
        const hours = hoursOfWork(amountNum, hourlyWage);
        if (hours !== null) parts.push(`≈ ${hours.toFixed(1)} ชม.`);
        if (primaryGoal) {
          const daysFaster = daysFasterToGoal(amountNum, primaryGoal, primaryGoalLinked);
          if (daysFaster !== null) parts.push(`เร็วขึ้น ${daysFaster.toFixed(1)} วัน (${primaryGoal.name})`);
        }
        return parts.length ? parts.join(" · ") : null;
      })()
    : null;

  const pickCategory = (label: string) => { setCustomMode(false); setForm({ ...form, category: label }); };

  const startPress = () => {
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setEditing(true);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 550);
  };
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };
  const handleChipClick = (label: string) => {
    if (longPressFired.current) { longPressFired.current = false; return; }
    if (editing) return;
    pickCategory(label);
  };
  const removeCat = (id: string, label: string) => {
    void db.categories.delete(id);
    if (form.category === label) setForm({ ...form, category: "" });
  };
  const onDragStart = (idx: number) => { dragFrom.current = idx; };
  const onDrop = (idx: number) => {
    const from = dragFrom.current;
    if (from === null || from === idx) return;
    const next = [...cats];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    void db.categories.bulkPut(next.map((c, i) => ({ ...c, order: i })));
    dragFrom.current = null;
  };

  const closeModal = () => {
    setEditingId(null);
    setForm({ type: "Income", category: "", amount: "", date: isoToday(), payment_method_id: "" });
    setCustomMode(false);
    setAddingCard(false);
    setActiveModal(null);
  };

  const submit = () => {
    if (!form.category || !form.amount) return;
    const id = editingId || uid();
    if (form.type === "Income") {
      void db.cashflow.put({ id, type: "Income", category: form.category, amount: Number(form.amount), date: form.date || isoToday(), incomeClass: classifyIncome(form.category) });
    } else {
      void db.cashflow.put({
        id, type: "Expense", category: form.category, amount: Number(form.amount), date: form.date || isoToday(),
        expense_class: classifyExpense(form.category),
        payment_method_id: effectivePaymentMethodId || null,
      });
    }
    if (customMode && saveShortcut) {
      const exists = cats.some((c) => c.label === form.category);
      if (!exists) {
        const cat: CategoryChip = { id: uid(), entryType: form.type, label: form.category, icon: "🏷️", order: cats.length };
        void db.categories.add(cat);
      }
    }
    closeModal();
  };

  const openNew = (type: CashFlowType) => {
    setEditingId(null);
    setForm({ type, category: "", amount: "", date: isoToday(), payment_method_id: "" });
    setCustomMode(false);
    setEditing(false);
    setAddingCard(false);
    setActiveModal(type);
  };
  const openEdit = (entry: CashFlowEntry) => {
    const catsForType = (allCategories || []).filter((c) => c.entryType === entry.type);
    const isCustom = !catsForType.some((c) => c.label === entry.category);
    setForm({
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount),
      date: entry.date,
      payment_method_id: entry.payment_method_id || "",
    });
    setCustomMode(isCustom);
    setEditingId(entry.id);
    setEditing(false);
    setAddingCard(false);
    setActiveModal(entry.type);
  };

  const addCard = () => {
    const name = newCardName.trim();
    if (!name) return;
    const id = uid();
    void db.paymentMethods.add({ id, name, kind: "บัตรเครดิต" });
    setForm({ ...form, payment_method_id: id });
    setNewCardName("");
    setAddingCard(false);
  };

  return (
    <CashflowEntryCtx.Provider value={{ openNew, openEdit, editingId, closeModal }}>
      {children}

      <Modal open={activeModal !== null} onClose={closeModal} title={activeModal === "Income" ? "💰 รับ" : "🧾 จ่าย"}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="วันที่"><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>

          <Field label="หมวดหมู่" wide>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 480 }}>
              {cats.map((c, idx) => (
                <div
                  key={c.id}
                  className={editing ? "fp-wiggle" : ""}
                  style={{ position: "relative", display: "inline-block" }}
                  draggable={editing}
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(idx)}
                >
                  <button
                    type="button"
                    onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
                    onTouchStart={startPress} onTouchEnd={cancelPress}
                    onClick={() => handleChipClick(c.label)}
                    style={chipStyle(!customMode && !editing && form.category === c.label)}
                  >
                    <span style={{ marginRight: 5 }}>{c.icon}</span>{c.label}
                  </button>
                  {editing && (
                    <button type="button" onClick={() => removeCat(c.id, c.label)} title="ลบปุ่มนี้" style={chipDeleteBadge}>×</button>
                  )}
                </div>
              ))}
              {!editing && (
                <button type="button" onClick={() => { setCustomMode(true); setForm({ ...form, category: "" }); setSaveShortcut(true); }} style={chipStyle(customMode)}>
                  ✍️ พิมพ์เอง
                </button>
              )}
              {editing && (
                <button type="button" onClick={() => setEditing(false)} style={doneButtonStyle}>✓ เสร็จสิ้น</button>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              {editing ? "ลากเพื่อจัดเรียงใหม่ · แตะ × เพื่อลบปุ่ม" : "กดค้างที่ปุ่มเพื่อจัดเรียงหรือลบ"}
            </div>
            {customMode && (
              <div style={{ marginTop: 8 }}>
                <input
                  autoFocus
                  style={{ ...inputStyle, width: "100%" }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="พิมพ์หมวดหมู่ของคุณเอง"
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", marginTop: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={saveShortcut} onChange={(e) => setSaveShortcut(e.target.checked)} />
                  บันทึกเป็นปุ่มลัดไว้ใช้ครั้งหน้า
                </label>
              </div>
            )}
          </Field>

          <Field label="จำนวน"><CalcInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="0" /></Field>

          {form.type === "Expense" && (
            <>
              <div style={{ flexBasis: "100%", height: 0 }} />
              <Field label="จ่ายด้วย" wide>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 480 }}>
                {paymentMethodsSorted.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForm({ ...form, payment_method_id: m.id })}
                    style={chipStyle(effectivePaymentMethodId === m.id)}
                  >
                    <span style={{ marginRight: 5 }}>{m.kind === "เงินสด" ? "💵" : "💳"}</span>{m.name}
                  </button>
                ))}
                <button type="button" onClick={() => setAddingCard(true)} style={chipStyle(addingCard)}>
                  ➕ เพิ่มบัตร
                </button>
              </div>
              {addingCard && (
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    style={{ ...inputStyle, flex: 1 }}
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder="ชื่อบัตร เช่น KTC, SCB"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCard(); } }}
                  />
                  <button type="button" onClick={addCard} style={doneButtonStyle}>เพิ่ม</button>
                </div>
              )}
              </Field>
            </>
          )}

          {form.category && (
            <span style={badgeStyle(form.type, preview)}>{badgeLabel(form.type, preview)}</span>
          )}
          {spendCompare && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, height: 20, background: "#F5EFFF", color: "#7A5C9E" }}>
              ⏱️ {spendCompare}
            </span>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>ยกเลิก</button>
            <AddButton onClick={submit} label={editingId ? "บันทึกการแก้ไข" : "เพิ่ม"} />
          </div>
        </div>
      </Modal>
    </CashflowEntryCtx.Provider>
  );
}
