"use client";

import { useState, type ChangeEvent, type CSSProperties } from "react";
import { db } from "@/lib/db";
import { uid } from "@/lib/calc";
import { AddButton, Field, Modal, inputStyle } from "@/components/ui";
import type { LiquidAsset, InvestmentAsset, PersonalAsset, Liability } from "@/lib/types";

const EXPORT_APP_ID = "financial-planning-asset-export";

interface AssetExportFile {
  app: string;
  version: number;
  exportedAt: string;
  liquidAssets: LiquidAsset[];
  investmentAssets: InvestmentAsset[];
  personalAssets: PersonalAsset[];
  liabilities: Liability[];
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

// Assets have no date field to filter by, so export/import is always a full
// snapshot of everything currently saved — unlike cashflow's date-ranged export.
function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const doExport = async () => {
    const [liquidAssets, investmentAssets, personalAssets, liabilities] = await Promise.all([
      db.liquidAssets.toArray(),
      db.investmentAssets.toArray(),
      db.personalAssets.toArray(),
      db.liabilities.toArray(),
    ]);
    const file: AssetExportFile = {
      app: EXPORT_APP_ID,
      version: 1,
      exportedAt: new Date().toISOString(),
      liquidAssets, investmentAssets, personalAssets, liabilities,
    };
    downloadJson(`สินทรัพย์_${new Date().toISOString().slice(0, 10)}.json`, file);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="📤 ส่งออกสินทรัพย์">
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 14 }}>
        จะส่งออกสินทรัพย์สภาพคล่อง เพื่อการลงทุน ส่วนตัว และหนี้สินทั้งหมดที่มีอยู่ตอนนี้
      </div>
      <AddButton onClick={doExport} label="ดาวน์โหลดไฟล์" />
    </Modal>
  );
}

// Always assigns fresh ids on import so it can never collide with or
// overwrite the receiver's own rows. Goal/liability links are dropped since
// those ids won't exist on a different device — the item still imports, just
// unlinked, rather than silently pointing at the wrong goal.
function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fileData, setFileData] = useState<AssetExportFile | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);

  const reset = () => { setFileData(null); setError(""); setDone(null); };
  const handleClose = () => { reset(); onClose(); };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setDone(null); setFileData(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AssetExportFile>;
      if (!parsed || !(parsed.liquidAssets || parsed.investmentAssets || parsed.personalAssets || parsed.liabilities)) {
        throw new Error("invalid");
      }
      setFileData({
        app: parsed.app || "",
        version: parsed.version || 1,
        exportedAt: parsed.exportedAt || "",
        liquidAssets: parsed.liquidAssets || [],
        investmentAssets: parsed.investmentAssets || [],
        personalAssets: parsed.personalAssets || [],
        liabilities: parsed.liabilities || [],
      });
    } catch {
      setError("ไฟล์ไม่ถูกต้อง หรือไม่ใช่ไฟล์ที่ส่งออกจากแอปนี้");
    }
  };

  const doImport = async () => {
    if (!fileData) return;
    const liquidToInsert = fileData.liquidAssets.map((a) => ({ ...a, id: uid(), goal_id: null }));
    const investmentToInsert = fileData.investmentAssets.map((a) => ({ ...a, id: uid(), goal_id: null }));
    const personalToInsert = fileData.personalAssets.map((a) => ({ ...a, id: uid(), liability_id: null }));
    const liabilitiesToInsert = fileData.liabilities.map((l) => ({ ...l, id: uid() }));
    await db.transaction("rw", [db.liquidAssets, db.investmentAssets, db.personalAssets, db.liabilities], async () => {
      if (liquidToInsert.length) await db.liquidAssets.bulkAdd(liquidToInsert);
      if (investmentToInsert.length) await db.investmentAssets.bulkAdd(investmentToInsert);
      if (personalToInsert.length) await db.personalAssets.bulkAdd(personalToInsert);
      if (liabilitiesToInsert.length) await db.liabilities.bulkAdd(liabilitiesToInsert);
    });
    setDone(liquidToInsert.length + investmentToInsert.length + personalToInsert.length + liabilitiesToInsert.length);
  };

  const totalInFile = fileData
    ? fileData.liquidAssets.length + fileData.investmentAssets.length + fileData.personalAssets.length + fileData.liabilities.length
    : 0;

  return (
    <Modal open={open} onClose={handleClose} title="📥 นำเข้าสินทรัพย์">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="เลือกไฟล์">
          <input type="file" accept="application/json" onChange={onFile} style={{ ...inputStyle, minWidth: 220 }} />
        </Field>
        {error && <div style={{ fontSize: 12, color: "#D07A4E" }}>{error}</div>}
        {fileData && done === null && (
          <>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              พบ {totalInFile} รายการในไฟล์ (สภาพคล่อง {fileData.liquidAssets.length} · เพื่อการลงทุน {fileData.investmentAssets.length} · ส่วนตัว {fileData.personalAssets.length} · หนี้สิน {fileData.liabilities.length})
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
              รายการจะถูกเพิ่มเป็นรายการใหม่ทั้งหมด (การผูกเป้าหมาย/หนี้สินเดิมจะไม่ติดมาด้วย เพราะเป็นคนละอุปกรณ์)
            </div>
            <div><AddButton onClick={doImport} label="นำเข้า" /></div>
          </>
        )}
        {done !== null && <div style={{ fontSize: 12.5, color: "#3FA88F", fontWeight: 600 }}>✓ นำเข้าแล้ว {done} รายการ</div>}
      </div>
    </Modal>
  );
}

export function AssetExportImport() {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  return (
    <>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={() => setExportOpen(true)} style={actionButtonStyle}>📤 ส่งออกข้อมูล</button>
        <button type="button" onClick={() => setImportOpen(true)} style={actionButtonStyle}>📥 นำเข้าข้อมูล</button>
      </div>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
