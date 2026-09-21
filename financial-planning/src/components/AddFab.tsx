"use client";

import { Plus } from "lucide-react";
import { useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";

const fabStyle: CSSProperties = {
  position: "fixed", left: 20, bottom: 90, zIndex: 40,
  width: 52, height: 52, borderRadius: "50%",
  border: "none", background: "#7FD1C9", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 4px 16px rgba(74,68,88,0.18)", cursor: "pointer",
};

const subscribeNever = () => () => {};

// Fixed (non-draggable) floating add button, mirrored on the opposite
// corner from the รับ/จ่าย FAB so the two never overlap.
//
// Portaled to <body>: the asset tabs slide sideways under a CSS transform
// while being swiped, and a transformed ancestor becomes the containing
// block for position:fixed children — left in place, the button would ride
// along with the list, or drop to the bottom of a long one, until the slide
// finished. The server snapshot is false so hydration matches the server's
// markup, which has no <body> to portal into; the button follows a pass
// later.
export function AddFab({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  if (!hydrated) return null;
  return createPortal(
    <button type="button" onClick={onClick} style={fabStyle} aria-label={t(TR.common.addItemAria)}>
      <Plus size={24} />
    </button>,
    document.body,
  );
}
