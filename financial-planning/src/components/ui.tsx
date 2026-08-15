"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";

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
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(74,68,88,0.35)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 12px",
      }}
      onClick={onClose}
    >
      <div
        className="fp-card"
        style={{
          width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto",
          padding: 22, borderRadius: "22px 22px 0 0", marginBottom: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="fp-display" style={{ fontSize: 18, fontWeight: 700, color: "#6B5490" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-soft)", padding: 4 }}
          >
            <X size={20} />
          </button>
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
      <label style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</label>
      {children}
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
  title, tint, subGroups,
}: {
  title: string;
  tint: string;
  subGroups: { label: string; items: ReactNode[] }[];
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12.5, color: "#8B7FA0", marginBottom: 7, fontWeight: 600 }}>{title}</div>
      <div className="fp-card" style={{ padding: 8, background: tint }}>
        {subGroups.map((sg, i) => (
          <div key={sg.label}>
            <div
              style={{
                fontFamily: "var(--font-prompt), 'Prompt', sans-serif", fontSize: 12, fontWeight: 700, color: "#6B5490",
                padding: "10px 14px 4px", marginTop: i > 0 ? 6 : 0, borderTop: i > 0 ? "1px dashed var(--line)" : "none",
              }}
            >
              {sg.label}
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
      <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{left}</div>
      {date && <span style={{ fontSize: 10.5, color: "var(--ink-soft)", background: "#F5EFFF", padding: "2px 8px", borderRadius: 999 }}>{date}</span>}
      <span className="fp-num" style={{ fontSize: 13.5, fontWeight: 600 }}>{right}</span>
      {onClick && (
        <span style={{ color: "var(--ink-soft)" }} aria-hidden>
          <Pencil size={12} />
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
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8, fontWeight: 600 }}>เลือกวันเริ่มรอบบัญชี</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <button key={d} type="button" onClick={() => { onChange(d); setOpen(false); }} style={dayCellStyle(d === value)}>
                {d}
              </button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "var(--ink-soft)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", cursor: "pointer" }}>
            <input type="checkbox" checked={shiftWeekend} onChange={(e) => onShiftWeekendChange(e.target.checked)} style={{ marginTop: 1 }} />
            ถ้าวันเริ่มตรงเสาร์-อาทิตย์ เลื่อนเป็นวันศุกร์ก่อนหน้า
          </label>
        </div>
      )}
    </div>
  );
}
