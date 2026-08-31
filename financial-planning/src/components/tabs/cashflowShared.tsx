import type { CSSProperties, ReactNode } from "react";
import { Row } from "@/components/ui";
import { fmt, fmtDateShort } from "@/lib/calc";
import { ICON_MAP } from "@/lib/constants";
import { CATEGORY_LABEL_EN, translateLabel, type Language } from "@/lib/i18n";
import type { CashFlowEntry } from "@/lib/types";

const dateHeaderStyle: CSSProperties = {
  fontFamily: "var(--font-prompt), 'Prompt', sans-serif",
  fontSize: 13, fontWeight: 600, color: "#645878",
  padding: "14px 14px 6px", marginTop: 6, borderTop: "1px solid var(--line)",
};
const firstDateHeaderStyle: CSSProperties = { ...dateHeaderStyle, borderTop: "none", marginTop: 0 };

function entryIcon(c: CashFlowEntry) {
  const bg = c.type === "Income" ? "#CDEEDF" : "#FBDCC2";
  return (
    <span
      style={{
        width: 30, height: 30, borderRadius: 10, background: bg, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
      }}
    >
      {ICON_MAP[c.category] || "🏷️"}
    </span>
  );
}

// Newest first, clustered under one prominent date header per day so a day
// with several entries doesn't repeat the same date on every row. Shared
// between the main cashflow list and the payment-method summary page.
export function renderByDay(
  entries: CashFlowEntry[],
  onDelete: (id: string) => void,
  onEdit?: (entry: CashFlowEntry) => void,
  extra?: (entry: CashFlowEntry) => ReactNode | null,
  lang: Language = "th"
): ReactNode[] {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const nodes: ReactNode[] = [];
  let lastDate: string | null = null;
  for (const c of sorted) {
    if (c.date !== lastDate) {
      nodes.push(
        <div key={`date-${c.date}`} style={lastDate === null ? firstDateHeaderStyle : dateHeaderStyle}>
          {fmtDateShort(c.date, lang)}
        </div>
      );
      lastDate = c.date;
    }
    const extraNode = extra ? extra(c) : null;
    const label = translateLabel(c.category, lang, CATEGORY_LABEL_EN);
    nodes.push(
      <Row
        key={c.id}
        icon={entryIcon(c)}
        left={
          extraNode ? (
            <div>
              <div>{label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 1 }}>{extraNode}</div>
            </div>
          ) : (
            label
          )
        }
        right={fmt(c.amount)}
        date={c.owner || undefined}
        onDelete={() => onDelete(c.id)}
        onClick={onEdit ? () => onEdit(c) : undefined}
      />
    );
  }
  return nodes;
}
