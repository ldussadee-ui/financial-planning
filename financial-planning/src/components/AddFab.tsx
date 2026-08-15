"use client";

import { Plus } from "lucide-react";
import type { CSSProperties } from "react";

const fabStyle: CSSProperties = {
  position: "fixed", left: 20, bottom: 90, zIndex: 40,
  width: 52, height: 52, borderRadius: "50%",
  border: "none", background: "#7FD1C9", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 16px rgba(74,68,88,0.18)", cursor: "pointer",
};

// Fixed (non-draggable) floating add button, mirrored on the opposite
// corner from the รับ/จ่าย FAB so the two never overlap.
export function AddFab({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={fabStyle} aria-label="เพิ่มรายการ">
      <Plus size={24} />
    </button>
  );
}
