"use client";

import { createContext, useContext, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { classifyExpense, classifyIncome, daysFasterToGoal, hoursOfWork, isoToday, uid } from "@/lib/calc";
import { createRecurringRule } from "@/lib/recurring";
import { useHourlyWage } from "@/hooks/useHourlyWage";
import { usePrimaryGoal } from "@/hooks/usePrimaryGoal";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, CATEGORY_LABEL_EN, PAYMENT_METHOD_LABEL_EN, translateLabel, type Language } from "@/lib/i18n";
import { Field, AddButton, DayPicker, Modal, cancelButtonStyle, inputStyle } from "@/components/ui";
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
function badgeLabel(type: CashFlowType, cls: string, lang: Language) {
  const t = <K extends { th: string; en: string }>(entry: K) => entry[lang];
  if (type === "Expense") {
    if (cls === "Fixed") return t(TR.cashflow.badgeFixed);
    if (cls === "Invest") return t(TR.cashflow.badgeInvest);
    return t(TR.cashflow.badgeGeneral);
  }
  return cls === "Passive" ? t(TR.cashflow.badgePassive) : t(TR.cashflow.badgeActive);
}
// Income classes share the app's original green (Active = deeper, Passive =
// lighter); expense classes share the original orange (Fixed = deeper,
// ทั่วไป = lighter) — matches the Income/Expense group colors elsewhere, so
// the hue itself signals income vs expense while the shade signals which
// class. Invest keeps the same deep green as Active — they're never shown
// side by side, so the reuse isn't ambiguous in practice.
function badgeStyle(type: CashFlowType, cls: string): CSSProperties {
  const base = { fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, height: 20 };
  if (type === "Expense") {
    if (cls === "Invest") return { ...base, background: "#E1F5EE", color: "#0F6E56" };
    if (cls === "Fixed") return { ...base, background: "#FFE3D6", color: "#D07A4E" };
    return { ...base, background: "#FFF1E6", color: "#E3A874" };
  }
  return cls === "Passive"
    ? { ...base, background: "#EEF9F2", color: "#5FA98A" }
    : { ...base, background: "#DFF3EA", color: "#0F6E56" };
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
  const { lang, t } = useLanguage();
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
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
  const [dayShiftWeekend, setDayShiftWeekend] = useState(false);
  const [activeModal, setActiveModal] = useState<CashFlowType | null>(null);
  const effectivePaymentMethodId = form.payment_method_id || defaultCashId || "";

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  // Pointer handlers read/write these refs (not the state above) so the
  // reorder math never depends on a re-render having landed yet — state is
  // only for the opacity/outline visual feedback, which can lag a frame.
  const draggingIdxRef = useRef<number | null>(null);
  const dragOverIdxRef = useRef<number | null>(null);

  const preview = form.type === "Expense" ? classifyExpense(form.category) : classifyIncome(form.category);
  const cats = (allCategories || []).filter((c) => c.entryType === form.type);

  const amountNum = Number(form.amount || 0);
  const spendCompare = form.type === "Expense" && amountNum > 0
    ? (() => {
        const parts: string[] = [];
        const hours = hoursOfWork(amountNum, hourlyWage);
        if (hours !== null) parts.push(lang === "en" ? `≈ ${hours.toFixed(1)} hrs` : `≈ ${hours.toFixed(1)} ชม.`);
        if (primaryGoal) {
          const daysFaster = daysFasterToGoal(amountNum, primaryGoal, primaryGoalLinked);
          if (daysFaster !== null) {
            parts.push(lang === "en"
              ? `${daysFaster.toFixed(1)}d faster (${primaryGoal.name})`
              : `เร็วขึ้น ${daysFaster.toFixed(1)} วัน (${primaryGoal.name})`);
          }
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
  // Pointer Events (not the HTML5 drag-and-drop API) so reordering works on
  // touch devices — native `draggable`/`ondragstart` never fires on mobile.
  const onChipPointerDown = (idx: number) => (e: ReactPointerEvent) => {
    if (!editing) return;
    e.preventDefault();
    draggingIdxRef.current = idx;
    dragOverIdxRef.current = idx;
    setDraggingIdx(idx);
    setDragOverIdx(idx);
  };
  const onCatsPointerMove = (e: ReactPointerEvent) => {
    if (draggingIdxRef.current === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const wrapper = el instanceof Element ? el.closest<HTMLElement>("[data-cat-idx]") : null;
    if (!wrapper) return;
    const idx = Number(wrapper.dataset.catIdx);
    if (!Number.isNaN(idx) && idx !== dragOverIdxRef.current) {
      dragOverIdxRef.current = idx;
      setDragOverIdx(idx);
    }
  };
  const onCatsPointerUp = () => {
    const from = draggingIdxRef.current;
    const to = dragOverIdxRef.current;
    draggingIdxRef.current = null;
    dragOverIdxRef.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
    if (from === null || to === null || from === to) return;
    const next = [...cats];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void db.categories.bulkPut(next.map((c, i) => ({ ...c, order: i })));
  };

  const closeModal = () => {
    setEditingId(null);
    setEditingRecurringId(null);
    setForm({ type: "Income", category: "", amount: "", date: isoToday(), payment_method_id: "" });
    setCustomMode(false);
    setAddingCard(false);
    setActiveModal(null);
    setRecurring(false);
    setDayOfMonth(new Date().getDate());
    setDayShiftWeekend(false);
  };

  const submit = () => {
    if (!form.category || !form.amount) return;
    if (recurring && !editingId) {
      void createRecurringRule({
        type: form.type, category: form.category, amount: Number(form.amount),
        dayOfMonth, shiftWeekend: dayShiftWeekend,
        payment_method_id: form.type === "Expense" ? (effectivePaymentMethodId || null) : null,
      });
      closeModal();
      return;
    }
    const id = editingId || uid();
    // Preserve recurringId when editing an entry that came from a recurring
    // rule — put() replaces the whole row, so omitting it here would
    // silently detach the entry from its source rule.
    const base = { id, category: form.category, amount: Number(form.amount), date: form.date || isoToday(), recurringId: editingRecurringId ?? undefined };
    if (form.type === "Income") {
      void db.cashflow.put({ ...base, type: "Income", incomeClass: classifyIncome(form.category) });
    } else {
      void db.cashflow.put({ ...base, type: "Expense", expense_class: classifyExpense(form.category), payment_method_id: effectivePaymentMethodId || null });
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
    setEditingRecurringId(null);
    setForm({ type, category: "", amount: "", date: isoToday(), payment_method_id: "" });
    setCustomMode(false);
    setEditing(false);
    setAddingCard(false);
    setActiveModal(type);
    setRecurring(false);
    setDayOfMonth(new Date().getDate());
    setDayShiftWeekend(false);
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
    setEditingRecurringId(entry.recurringId ?? null);
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

      <Modal open={activeModal !== null} onClose={closeModal} title={activeModal === "Income" ? t(TR.cashflow.income$) : t(TR.cashflow.expense$)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.cashflow.date)}>
            {recurring && !editingId ? (
              <DayPicker
                value={dayOfMonth}
                onChange={setDayOfMonth}
                shiftWeekend={dayShiftWeekend}
                onShiftWeekendChange={setDayShiftWeekend}
                buttonLabel={t(TR.recurring.dayButtonLabel)}
                popoverTitle={t(TR.recurring.chooseDay)}
                maxDay={31}
              />
            ) : (
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            )}
          </Field>

          {!editingId && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-soft)", cursor: "pointer" }}>
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
              {t(TR.recurring.toggleLabel)}
            </label>
          )}

          {editingId && editingRecurringId && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, flexBasis: "100%" }}>
              <span style={{ color: "#7A5C9E", fontWeight: 600 }}>{t(TR.recurring.fromRecurringBadge)}</span>
              <Link href="/cashflow/recurring" style={{ color: "#7A5C9E", textDecoration: "none", fontWeight: 600 }}>{t(TR.recurring.editSourceLink)}</Link>
            </div>
          )}

          <Field label={t(TR.cashflow.category)} wide>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 480 }}
              onPointerMove={onCatsPointerMove}
              onPointerUp={onCatsPointerUp}
              onPointerCancel={onCatsPointerUp}
            >
              {cats.map((c, idx) => (
                <div
                  key={c.id}
                  data-cat-idx={idx}
                  className={editing && draggingIdx !== idx ? "fp-wiggle" : ""}
                  style={{
                    position: "relative", display: "inline-block",
                    touchAction: editing ? "none" : undefined,
                    opacity: draggingIdx === idx ? 0.4 : 1,
                    outline: dragOverIdx === idx && draggingIdx !== null && draggingIdx !== idx ? "2px dashed #7FD1C9" : "none",
                    outlineOffset: 3,
                  }}
                  onPointerDown={onChipPointerDown(idx)}
                >
                  <button
                    type="button"
                    onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
                    onTouchStart={startPress} onTouchEnd={cancelPress}
                    onClick={() => handleChipClick(c.label)}
                    style={chipStyle(!customMode && !editing && form.category === c.label)}
                  >
                    <span style={{ marginRight: 5 }}>{c.icon}</span>{translateLabel(c.label, lang, CATEGORY_LABEL_EN)}
                  </button>
                  {editing && (
                    <button type="button" onClick={() => removeCat(c.id, c.label)} title={t(TR.cashflow.removeShortcut)} style={chipDeleteBadge}>×</button>
                  )}
                </div>
              ))}
              {!editing && (
                <button type="button" onClick={() => { setCustomMode(true); setForm({ ...form, category: "" }); setSaveShortcut(true); }} style={chipStyle(customMode)}>
                  {t(TR.cashflow.typeOwn)}
                </button>
              )}
              {editing && (
                <button type="button" onClick={() => setEditing(false)} style={doneButtonStyle}>{t(TR.cashflow.done)}</button>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              {editing ? t(TR.cashflow.dragToReorder) : t(TR.cashflow.holdToReorder)}
            </div>
            {customMode && (
              <div style={{ marginTop: 8 }}>
                <input
                  autoFocus
                  style={{ ...inputStyle, width: "100%" }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder={t(TR.cashflow.typeCustomCategory)}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", marginTop: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={saveShortcut} onChange={(e) => setSaveShortcut(e.target.checked)} />
                  {t(TR.cashflow.saveAsShortcut)}
                </label>
              </div>
            )}
          </Field>

          <Field label={t(TR.common.amount)}><CalcInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="0" /></Field>

          {form.type === "Expense" && (
            <>
              <div style={{ flexBasis: "100%", height: 0 }} />
              <Field label={t(TR.cashflow.paidWith)} wide>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 480 }}>
                {paymentMethodsSorted.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForm({ ...form, payment_method_id: m.id })}
                    style={chipStyle(effectivePaymentMethodId === m.id)}
                  >
                    <span style={{ marginRight: 5 }}>{m.kind === "เงินสด" ? "💵" : "💳"}</span>{translateLabel(m.name, lang, PAYMENT_METHOD_LABEL_EN)}
                  </button>
                ))}
                <button type="button" onClick={() => setAddingCard(true)} style={chipStyle(addingCard)}>
                  {t(TR.cashflow.addCard)}
                </button>
              </div>
              {addingCard && (
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    style={{ ...inputStyle, flex: 1 }}
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    placeholder={t(TR.cashflow.cardNamePlaceholder)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCard(); } }}
                  />
                  <button type="button" onClick={addCard} style={doneButtonStyle}>{t(TR.common.add)}</button>
                </div>
              )}
              </Field>
            </>
          )}

          {form.category && (
            <span style={badgeStyle(form.type, preview)}>{badgeLabel(form.type, preview, lang)}</span>
          )}
          {spendCompare && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, height: 20, background: "#F5EFFF", color: "#7A5C9E" }}>
              ⏱️ {spendCompare}
            </span>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>
    </CashflowEntryCtx.Provider>
  );
}
