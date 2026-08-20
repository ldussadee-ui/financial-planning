"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Plus, Trash2, ChevronRight, X } from "lucide-react";
import { fmt } from "@/lib/calc";

export function SectionHeader({ title, sub, chip }: { title: string; sub?: string; chip?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26, flexWrap: "wrap", gap: 10 }}>
      <div>
        <div className="fp-display" style={{ fontSize: 26, fontWeight: 700, color: "#6B5490" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 5 }}>{sub}</div>}
      </div>
      {chip && (
        <div className="fp-chip">
          <span aria-hidden>✨</span> {chip}
        </div>
      )}
    </div>
  );
}

export function Modal({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Refs (not the state above) drive the dismiss decision so it never
  // depends on a re-render having landed yet — state is only for the
  // translateY visual, which can lag a frame without breaking anything.
  const startYRef = useRef<number | null>(null);
  const dragYRef = useRef(0);

  if (!open) return null;

  const onHandlePointerDown = (e: ReactPointerEvent) => {
    startYRef.current = e.clientY;
    setDragging(true);
  };
  const onSheetPointerMove = (e: ReactPointerEvent) => {
    if (startYRef.current === null) return;
    const delta = Math.max(0, e.clientY - startYRef.current);
    dragYRef.current = delta;
    setDragY(delta);
  };
  const onSheetPointerUp = () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    setDragging(false);
    setDragY(0);
    if (dragYRef.current > 120) onClose();
    dragYRef.current = 0;
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(28,24,34,0.32)",
        backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 12px",
      }}
      onClick={onClose}
    >
      <div
        className="fp-card fp-sheet"
        style={{
          width: "100%", maxWidth: 480, overflowY: "auto",
          padding: 22, borderRadius: "22px 22px 0 0", marginBottom: 0,
          transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerMove={onSheetPointerMove}
        onPointerUp={onSheetPointerUp}
        onPointerCancel={onSheetPointerUp}
      >
        <div
          onPointerDown={onHandlePointerDown}
          style={{ margin: "-22px -22px 10px", padding: "10px 22px 6px", cursor: "grab", touchAction: "none" }}
        >
          <div style={{ width: 36, height: 5, background: "#e3d9ce", borderRadius: 999, margin: "0 auto 14px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="fp-display" style={{ fontSize: 18, fontWeight: 600, color: "#6B5490" }}>{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-soft)", padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0" }}>
      <span style={{ fontSize: big ? 14 : 13, color: "var(--ink-soft)" }}>{label}</span>
      <span className="fp-num" style={{ fontSize: big ? 18 : 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// A thin progress bar for "spent vs budget", used wherever a per-category
// budget is shown (cashflow tab, reports, dashboard alert card). Renders
// nothing when no budget is set for the category, so callers can render it
// unconditionally.
export function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  if (!budget) return null;
  const pct = Math.min((spent / budget) * 100, 100);
  const over = spent > budget;
  const color = over ? "#FF8C7A" : pct >= 80 ? "#D07A4E" : "#0F6E56";
  return (
    <div>
      <div style={{ height: 5, background: "#F0E9E2", borderRadius: 999, overflow: "hidden", marginTop: 4 }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <div className="fp-num" style={{ fontSize: 12, color: over ? "#FF8C7A" : "var(--ink-soft)", marginTop: 2 }}>
        {fmt(spent)} / {fmt(budget)}{over ? " · เกินงบ" : ""}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: "28px 20px", fontSize: 13, color: "var(--ink-soft)" }}>{text} 🌤️</div>;
}

export const inputStyle: CSSProperties = {
  border: "1px solid var(--line)", borderRadius: 12, padding: "8px 12px",
  fontSize: 13, background: "#FFFCFA", color: "var(--ink)", minWidth: 130,
};
export const deleteBtn: CSSProperties = { border: "none", background: "transparent", color: "var(--ink-soft)", cursor: "pointer", padding: 4, borderRadius: 8 };
export const cancelButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink-soft)",
  borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36,
};

export function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: wide ? 480 : undefined }}>
      <label style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

// Single-track control for choosing one of a small, fixed set of options —
// e.g. a granularity or sub-tab switch — as an alternative to a row of
// separate chip buttons, matching iOS's segmented control pattern.
export function SegmentedControl<T extends string>({
  options, value, onChange, small,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  const n = options.length;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div style={{ position: "relative", display: "flex", background: "var(--track)", borderRadius: small ? 9 : 11, padding: 3 }}>
      <div
        style={{
          position: "absolute", top: 3, bottom: 3,
          left: `calc(${(idx * 100) / n}% + 3px)`, width: `calc(${100 / n}% - 6px)`,
          background: "#fff", borderRadius: small ? 7 : 8, boxShadow: "0 1px 4px rgba(74,68,88,0.18)",
          transition: "left 0.2s ease",
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            position: "relative", zIndex: 1, flex: 1, textAlign: "center", border: "none", background: "transparent",
            cursor: "pointer", padding: small ? "5px 2px" : "7px 4px",
            fontSize: small ? 11 : 12.5, fontWeight: 600,
            color: o.value === value ? "var(--ink)" : "var(--ink-soft)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AddButton({ onClick, label = "เพิ่ม" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, background: "#7FD1C9", color: "#fff",
        border: "none", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36,
      }}
    >
      <Plus size={14} /> {label}
    </button>
  );
}

export function Group({ title, tint, children }: { title: string; tint: string; children: ReactNode[] }) {
  const items = children.filter(Boolean);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12.5, color: "#8B7FA0", marginBottom: 7, fontWeight: 600 }}>{title}</div>
      <div className="fp-card" style={{ padding: 8, background: items.length ? tint : "#FAF6F1" }}>
        {items.length ? items : <EmptyState text="ยังไม่มีรายการ" />}
      </div>
    </div>
  );
}

// One outer card (e.g. "Income") holding several always-visible labeled
// sub-sections (e.g. "Active", "Passive") — each keeps its own empty state
// rather than the whole card collapsing when a sub-section has no items.
export function NestedGroup({
  label, amount, accent, tint, subGroups,
}: {
  label: string;
  amount: string;
  accent: string;
  tint: string;
  subGroups: { label: string; amount: string; items: ReactNode[]; dot?: string }[];
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 20, color: accent, fontWeight: 700 }}>{label}</span>
        <span className="fp-num" style={{ fontSize: 20, fontWeight: 700, color: accent }}>{amount}</span>
      </div>
      <div className="fp-card" style={{ padding: 8, background: tint }}>
        {subGroups.map((sg, i) => (
          <div key={sg.label}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 7,
                fontFamily: "var(--font-prompt), 'Prompt', sans-serif",
                padding: "10px 14px 4px", marginTop: i > 0 ? 6 : 0, borderTop: i > 0 ? "1px solid var(--line)" : "none",
              }}
            >
              {sg.dot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: sg.dot, flexShrink: 0 }} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: sg.dot || "#8B7FA0" }}>{sg.label}</span>
              <span className="fp-num" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: sg.dot || "#8B7FA0" }}>
                {sg.amount}
              </span>
            </div>
            {sg.items.length ? sg.items : <EmptyState text="ยังไม่มีรายการ" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Row({
  left, right, date, icon, onDelete, onClick,
}: {
  left: ReactNode; right: string; date?: string; icon?: ReactNode; onDelete: () => void; onClick?: () => void;
}) {
  return (
    <div
      className="fp-row"
      style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{left}</div>
      {date && <span style={{ fontSize: 12, color: "var(--ink-soft)", background: "#F5EFFF", padding: "2px 8px", borderRadius: 999 }}>{date}</span>}
      <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{right}</span>
      {onClick && (
        <span style={{ color: "var(--ink-soft)", display: "flex" }} aria-hidden>
          <ChevronRight size={16} />
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("ลบรายการนี้ใช่หรือไม่?")) onDelete();
        }}
        style={{ ...deleteBtn, marginLeft: 6 }}
        aria-label="ลบรายการ"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

const dayPickerButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
const dayPickerPopoverStyle: CSSProperties = {
  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30,
  background: "#fff", borderRadius: 18, boxShadow: "0 8px 24px rgba(74,68,88,0.12)",
  padding: 14, width: 260,
};
function dayCellStyle(active: boolean): CSSProperties {
  return {
    width: 26, height: 26, borderRadius: 8, border: "none", fontSize: 11.5, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: active ? "#7FD1C9" : "#FBF7F2",
    color: active ? "#fff" : "var(--ink-soft)", fontWeight: active ? 700 : 400,
  };
}

export function DayPicker({
  value, onChange, shiftWeekend, onShiftWeekendChange,
}: {
  value: number;
  onChange: (day: number) => void;
  shiftWeekend: boolean;
  onShiftWeekendChange: (shift: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={dayPickerButtonStyle}>
        🗓️ เริ่มวันที่ {value}
      </button>
      {open && (
        <div style={dayPickerPopoverStyle}>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8, fontWeight: 600 }}>เลือกวันเริ่มรอบบัญชี</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <button key={d} type="button" onClick={() => { onChange(d); setOpen(false); }} style={dayCellStyle(d === value)}>
                {d}
              </button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--ink-soft)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", cursor: "pointer" }}>
            <input type="checkbox" checked={shiftWeekend} onChange={(e) => onShiftWeekendChange(e.target.checked)} style={{ marginTop: 1 }} />
            ถ้าวันเริ่มตรงเสาร์-อาทิตย์ เลื่อนเป็นวันศุกร์ก่อนหน้า
          </label>
        </div>
      )}
    </div>
  );
}
