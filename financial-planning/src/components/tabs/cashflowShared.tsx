import type { CSSProperties, ReactNode } from "react";
import { Row } from "@/components/ui";
import { fmt, fmtDateShort } from "@/lib/calc";
import type { CashFlowEntry } from "@/lib/types";

const dateHeaderStyle: CSSProperties = {
  fontFamily: "var(--font-prompt), 'Prompt', sans-serif",
  fontSize: 13, fontWeight: 700, color: "#7A5C9E",
  padding: "14px 14px 6px", marginTop: 6, borderTop: "1px dashed var(--line)",
};
const firstDateHeaderStyle: CSSProperties = { ...dateHeaderStyle, borderTop: "none", marginTop: 0 };

// Newest first, clustered under one prominent date header per day so a day
// with several entries doesn't repeat the same date on every row. Shared
// between the main cashflow list and the payment-method summary page.
export function renderByDay(
  entries: CashFlowEntry[],
  onDelete: (id: string) => void,
  onEdit?: (entry: CashFlowEntry) => void,
  extra?: (entry: CashFlowEntry) => ReactNode | null
): ReactNode[] {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const nodes: ReactNode[] = [];
  let lastDate: string | null = null;
  for (const c of sorted) {
    if (c.date !== lastDate) {
      nodes.push(
        <div key={`date-${c.date}`} style={lastDate === null ? firstDateHeaderStyle : dateHeaderStyle}>
          {fmtDateShort(c.date)}
        </div>
      );
      lastDate = c.date;
    }
    const extraNode = extra ? extra(c) : null;
    nodes.push(
      <Row
        key={c.id}
        left={
          extraNode ? (
            <div>
              <div>{c.category}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 1 }}>{extraNode}</div>
            </div>
          ) : (
            c.category
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
