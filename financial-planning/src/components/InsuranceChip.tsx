"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

// The small label under a loan or a personal asset saying whether it is
// insured. Tapping it opens the insurance page, without also opening the
// row's edit form underneath. A bare glyph rather than a sticker icon, and a
// tag rather than a pill, so it can wrap neatly in the narrow name column of
// a row on a phone instead of running into the amount.
export function InsuranceChip({ insured, children }: { insured: boolean; children: ReactNode }) {
  return (
    <Link
      href="/dashboard/insurance"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, maxWidth: "100%", marginTop: 5, marginRight: 6,
        fontSize: 12, fontWeight: 600, lineHeight: 1.35, color: "var(--ink)", textDecoration: "none",
        border: "1.5px solid var(--border)", borderRadius: 8, padding: "1px 7px",
        background: insured ? "var(--teal)" : "var(--yellow)",
      }}
    >
      {insured && <ShieldCheck size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} aria-hidden />}
      <span>{children}</span>
    </Link>
  );
}
