"use client";

import { useState, type ChangeEvent, type CSSProperties } from "react";
import { db } from "@/lib/db";
import {
  daysSince, exportAll, importAll, isBackupFile, isFromNewerSchema,
  LAST_BACKUP_KEY, markBackedUp, summarize, wipeAll, type BackupFile,
} from "@/lib/backup";
import { useSetting } from "@/hooks/useSetting";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, fillText } from "@/lib/i18n";
import { Field, Modal, cancelButtonStyle, inputStyle } from "@/components/ui";

// Anything past this and the reminder starts nudging rather than just
// reporting. Roughly a month: long enough not to nag, short enough that a
// browser wiping its storage costs weeks of entries rather than years.
const STALE_AFTER_DAYS = 30;

const actionButtonStyle: CSSProperties = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const primaryButtonStyle: CSSProperties = {
  ...actionButtonStyle, border: "none", background: "#7FD1C9", color: "#fff",
};
// Erasing is the one action here with no undo, so it is the only one that
// wears a warning color — and it stays outline-only rather than a filled
// red button, which would read as the primary thing to do on the card.
const dangerButtonStyle: CSSProperties = {
  ...actionButtonStyle, border: "1px solid #E5B4AA", color: "#A32D2D",
};
const dangerFilledStyle: CSSProperties = {
  ...actionButtonStyle, border: "none", background: "#A32D2D", color: "#fff",
};
const warningBoxStyle: CSSProperties = {
  background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "10px 12px",
  fontSize: 12.5, lineHeight: 1.5,
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function runBackup(lang: string) {
  const file = await exportAll();
  const stamp = new Date().toISOString().slice(0, 10);
  downloadJson(`${lang === "en" ? "backup" : "สำรองข้อมูล"}_${stamp}.json`, file);
  await markBackedUp();
}

function RestoreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [file, setFile] = useState<BackupFile | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setFile(null); setError(""); setDone(null); setBusy(false); };
  const handleClose = () => { reset(); onClose(); };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setError(""); setDone(null); setFile(null);
    try {
      const parsed: unknown = JSON.parse(await picked.text());
      if (!isBackupFile(parsed)) {
        setError(t(TR.settings.restoreWrongFile));
        return;
      }
      if (isFromNewerSchema(parsed)) {
        setError(fillText(t(TR.settings.restoreNewerSchema), { file: parsed.schemaVersion, app: db.verno }));
        return;
      }
      setFile(parsed);
    } catch {
      setError(t(TR.common.invalidFile));
    }
  };

  const doRestore = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      setDone(await importAll(file));
    } catch {
      setError(t(TR.common.invalidFile));
    } finally {
      setBusy(false);
    }
  };

  const summary = file ? summarize(file) : null;

  return (
    <Modal open={open} onClose={handleClose} title={t(TR.settings.restoreTitle)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {done === null ? (
          <>
            <div style={warningBoxStyle}>{t(TR.settings.restoreWarning)}</div>
            <Field label={t(TR.common.selectFile)}>
              <input type="file" accept="application/json" onChange={onFile} style={{ ...inputStyle, minWidth: 220 }} />
            </Field>
            {error && <div style={{ fontSize: 12, color: "#A32D2D", lineHeight: 1.5 }}>{error}</div>}
            {file && summary && (
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                {fillText(t(TR.settings.restoreFileInfo), {
                  date: file.exportedAt.slice(0, 10),
                  rows: summary.total.toLocaleString(),
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={handleClose} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
              {file && (
                <button type="button" onClick={doRestore} disabled={busy} style={dangerFilledStyle}>
                  {t(TR.settings.restoreConfirm)}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13 }}>{fillText(t(TR.settings.restoreDone), { rows: done.toLocaleString() })}</div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={handleClose} style={primaryButtonStyle}>{t(TR.common.close)}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function WipeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, t } = useLanguage();
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const word = t(TR.settings.wipeConfirmWord);
  const handleClose = () => { setTyped(""); setDone(false); setBusy(false); onClose(); };

  const doWipe = async () => {
    if (typed.trim() !== word || busy) return;
    setBusy(true);
    await wipeAll();
    setBusy(false);
    setDone(true);
  };

  return (
    <Modal open={open} onClose={handleClose} title={t(TR.settings.wipeTitle)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {done ? (
          <>
            <div style={{ fontSize: 13 }}>{t(TR.settings.wipeDone)}</div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={handleClose} style={primaryButtonStyle}>{t(TR.common.close)}</button>
            </div>
          </>
        ) : (
          <>
            <div style={warningBoxStyle}>{t(TR.settings.wipeWarning)}</div>
            {/* Offered right here rather than left to the user to remember:
                the moment before erasing is the last chance to keep any of it. */}
            <button type="button" onClick={() => void runBackup(lang)} style={actionButtonStyle}>
              {t(TR.settings.wipeBackupFirst)}
            </button>
            <Field label={fillText(t(TR.settings.wipeTypeToConfirm), { word })}>
              <input
                style={{ ...inputStyle, width: "100%" }}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={word}
                autoComplete="off"
              />
            </Field>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={handleClose} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
              <button
                type="button"
                onClick={doWipe}
                disabled={typed.trim() !== word || busy}
                style={{ ...dangerFilledStyle, opacity: typed.trim() === word ? 1 : 0.45, cursor: typed.trim() === word ? "pointer" : "not-allowed" }}
              >
                {t(TR.settings.wipeConfirm)}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export function FullBackup() {
  const { lang, t } = useLanguage();
  const [lastBackup] = useSetting<string | null>(LAST_BACKUP_KEY, null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);

  const days = daysSince(lastBackup);
  const stale = days === null || days >= STALE_AFTER_DAYS;
  const statusText =
    days === null ? t(TR.settings.backupNever)
      : days === 0 ? t(TR.settings.backupToday)
        : fillText(t(TR.settings.backupDaysAgo), { days });

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: stale ? "#A32D2D" : "#0F6E56" }}>{statusText}</span>
        {stale && <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t(TR.settings.backupStale)}</span>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => void runBackup(lang)} style={primaryButtonStyle}>
          {t(TR.settings.backupDownload)}
        </button>
        <button type="button" onClick={() => setRestoreOpen(true)} style={actionButtonStyle}>
          {t(TR.settings.backupRestore)}
        </button>
        <button type="button" onClick={() => setWipeOpen(true)} style={dangerButtonStyle}>
          {t(TR.settings.backupWipe)}
        </button>
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.55 }}>
        {t(TR.settings.backupWhyNote)}
      </div>

      <RestoreModal open={restoreOpen} onClose={() => setRestoreOpen(false)} />
      <WipeModal open={wipeOpen} onClose={() => setWipeOpen(false)} />
    </>
  );
}
