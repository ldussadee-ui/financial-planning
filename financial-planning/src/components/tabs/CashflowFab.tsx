"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useCashflowEntry } from "./CashflowEntryModal";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import type { CashFlowType } from "@/lib/types";

const DRAG_THRESHOLD = 6;

// A single floating button that can be dragged independently. Drag-vs-tap
// is disambiguated by movement distance: dragging past the threshold
// suppresses the click that would otherwise fire on release.
function DraggableButton({
  type, label, color, defaultRight, defaultBottom, onOpen,
}: {
  type: CashFlowType; label: string; color: string; defaultRight: number; defaultBottom: number; onOpen: (type: CashFlowType) => void;
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const elRef = useRef<HTMLButtonElement>(null);
  const drag = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 });

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = { dragging: true, moved: false, startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) d.moved = true;
    if (!d.moved) return;
    const el = elRef.current;
    const w = el?.offsetWidth || 0;
    const h = el?.offsetHeight || 0;
    const left = Math.min(Math.max(0, d.origLeft + dx), window.innerWidth - w);
    const top = Math.min(Math.max(0, d.origTop + dy), window.innerHeight - h);
    setPos({ left, top });
  };
  const onPointerUp = () => { drag.current.dragging = false; };
  const handleClick = () => {
    if (drag.current.moved) return;
    onOpen(type);
  };

  const posStyle: CSSProperties = pos
    ? { position: "fixed", left: pos.left, top: pos.top, zIndex: 40 }
    : { position: "fixed", right: defaultRight, bottom: defaultBottom, zIndex: 40 };

  return (
    <button
      ref={elRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
      style={{
        ...posStyle,
        border: "none", background: color, color: "#fff", borderRadius: 999,
        width: 96, padding: "14px 0", fontSize: 13, fontWeight: 600, cursor: "grab",
        boxShadow: "0 4px 16px rgba(74,68,88,0.18)", touchAction: "none", userSelect: "none",
      }}
    >
      {label}
    </button>
  );
}

// Two independently draggable floating buttons, mounted globally so income
// and expense entries can be opened from any tab, not just the cashflow page.
export function CashflowFab() {
  const { openNew } = useCashflowEntry();
  const { t } = useLanguage();
  return (
    <>
      <DraggableButton type="Income" label={t(TR.cashflow.income$)} color="#7FD1C9" defaultRight={20} defaultBottom={150} onOpen={openNew} />
      <DraggableButton type="Expense" label={t(TR.cashflow.expense$)} color="#FF9AA2" defaultRight={20} defaultBottom={90} onOpen={openNew} />
    </>
  );
}
