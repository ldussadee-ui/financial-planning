"use client";

import { useState, type ChangeEvent, type CSSProperties } from "react";
import { db } from "@/lib/db";
import { isoToday, uid } from "@/lib/calc";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { Field, AddButton, Modal, inputStyle } from "@/components/ui";
import type { CashFlowEntry } from "@/lib/types";

const EXPORT_APP_ID = "financial-planning-cashflow-export";

interface ExportFile {
  app: string;
  version: number;
  exportedAt: string;
  rangeStart: string;
  rangeEnd: string;
  entries: CashFlowEntry[];
}

const actionButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Only cashflow entries are exportable — assets/liabilities/goals stay local
// to each device, since the family-sharing use case this serves ("what did
// we spend as a family") only concerns income/expense totals.
function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, t } = useLanguage();
  const today = isoToday();
  const [start, setStart] = useState(today.slice(0, 8) + "01");
  const [end, setEnd] = useState(today);

  const doExport = async () => {
    const all = await db.cashflow.toArray();
    const entries = all.filter((e) => e.date >= start && e.date <= end);
    const file: ExportFile = {
      app: EXPORT_APP_ID,
      version: 1,
      exportedAt: new Date().toISOString(),
      rangeStart: start,
      rangeEnd: end,
      entries,
    };
    downloadJson(`${lang === "en" ? `cashflow_${start}_to_${end}` : `รายรับจ่าย_${start}_ถึง_${end}`}.json`, file);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t(TR.exportImport.exportCashflowTitle)}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label={t(TR.exportImport.fromDate)}><input type="date" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label={t(TR.exportImport.toDate)}><input type="date" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        <AddButton onClick={doExport} label={t(TR.common.downloadFile)} />
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
        {t(TR.exportImport.exportRangeNote)}
      </div>
    </Modal>
  );
}

// Re-tags every imported entry with the sender's name (so combined totals
// still show who spent what) and always assigns fresh local ids, so
// importing never collides with or overwrites the receiver's own rows.
function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [fileData, setFileData] = useState<ExportFile | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [owner, setOwner] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);

  const reset = () => {
    setFileData(null); setStart(""); setEnd(""); setOwner(""); setError(""); setDone(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setDone(null); setFileData(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ExportFile>;
      if (!parsed || !Array.isArray(parsed.entries)) throw new Error("invalid");
      const dates = parsed.entries.map((en) => en.date).filter(Boolean).sort();
      setFileData(parsed as ExportFile);
      setStart(dates[0] || parsed.rangeStart || "");
      setEnd(dates[dates.length - 1] || parsed.rangeEnd || "");
    } catch {
      setError(t(TR.common.invalidFile));
    }
  };

  const doImport = async () => {
    if (!fileData || !owner.trim()) return;
    const inRange = fileData.entries.filter((en) => en.date >= start && en.date <= end);
    const toInsert: CashFlowEntry[] = inRange.map((en) => ({
      id: uid(),
      type: en.type,
      category: en.category,
      amount: en.amount,
      date: en.date,
      incomeClass: en.incomeClass,
      expense_class: en.expense_class,
      payment_method_id: null,
      owner: owner.trim(),
    }));
    await db.cashflow.bulkAdd(toInsert);
    setDone(toInsert.length);
  };

  return (
    <Modal open={open} onClose={handleClose} title={t(TR.exportImport.importCashflowTitle)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={t(TR.common.selectFile)}>
          <input type="file" accept="application/json" onChange={onFile} style={{ ...inputStyle, minWidth: 220 }} />
        </Field>
        {error && <div style={{ fontSize: 12, color: "#D07A4E" }}>{error}</div>}
        {fileData && done === null && (
          <>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t(TR.exportImport.foundEntriesInFile)} {fileData.entries.length} {t(TR.exportImport.entriesInFile)}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Field label={t(TR.exportImport.fromDate)}><input type="date" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label={t(TR.exportImport.toDate)}><input type="date" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
            </div>
            <Field label={t(TR.exportImport.ownerName)}>
              <input style={inputStyle} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder={t(TR.exportImport.ownerPlaceholder)} />
            </Field>
            <div>
              <AddButton onClick={doImport} label={t(TR.common.importAction)} />
            </div>
          </>
        )}
        {done !== null && (
          <div style={{ fontSize: 12.5, color: "#0F6E56", fontWeight: 600 }}>{t(TR.exportImport.importedCount)} {done} {t(TR.exportImport.itemsWord)} {t(TR.exportImport.importedOf)} {owner}</div>
        )}
      </div>
    </Modal>
  );
}

export function CashflowExportImport() {
  const { t } = useLanguage();
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  return (
    <>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={() => setExportOpen(true)} style={actionButtonStyle}>📤 {t(TR.common.exportData)}</button>
        <button type="button" onClick={() => setImportOpen(true)} style={actionButtonStyle}>📥 {t(TR.common.importData)}</button>
      </div>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
