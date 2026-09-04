import { db } from "./db";
import pkg from "../../package.json";

// Distinct from the per-domain export ids ("...-cashflow-export",
// "...-asset-export"): those files merge someone else's rows into yours,
// this one replaces your database wholesale. Mixing them up would either
// duplicate everything or wipe everything, so the loader checks the id.
export const BACKUP_APP_ID = "financial-planning-full-backup";

/** Settings key holding the ISO timestamp of the last full backup. */
export const LAST_BACKUP_KEY = "lastFullBackupAt";

/** Settings key the seeder uses to decide a database is already set up. */
const SEEDED_KEY = "seeded";

export interface BackupFile {
  app: string;
  /** Dexie schema version the rows were written under. */
  schemaVersion: number;
  /** App version, for support questions — not used to gate anything. */
  appVersion: string;
  exportedAt: string;
  /** Every table in the database, keyed by table name. */
  tables: Record<string, unknown[]>;
}

export interface BackupSummary {
  /** Row count per table, largest first — what the UI shows before restoring. */
  counts: { table: string; rows: number }[];
  total: number;
}

export function summarize(file: BackupFile): BackupSummary {
  const counts = Object.entries(file.tables)
    .map(([table, rows]) => ({ table, rows: Array.isArray(rows) ? rows.length : 0 }))
    .filter((c) => c.rows > 0)
    .sort((a, b) => b.rows - a.rows);
  return { counts, total: counts.reduce((s, c) => s + c.rows, 0) };
}

// Reads whatever tables the database currently declares rather than a
// hardcoded list, so a table added in a later version is included in
// backups without anyone having to remember to update this file.
export async function exportAll(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {};
  await db.transaction("r", db.tables, async () => {
    for (const table of db.tables) tables[table.name] = await table.toArray();
  });
  return {
    app: BACKUP_APP_ID,
    schemaVersion: db.verno,
    appVersion: pkg.version,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const file = value as Partial<BackupFile>;
  return file.app === BACKUP_APP_ID && !!file.tables && typeof file.tables === "object";
}

/**
 * True when the file was written by a newer schema than this app knows.
 * Restoring it would put rows in shapes this version has no migration for,
 * so the UI refuses rather than corrupting the database.
 */
export function isFromNewerSchema(file: BackupFile): boolean {
  return typeof file.schemaVersion === "number" && file.schemaVersion > db.verno;
}

// Rows are written back with their original primary keys. That is the whole
// point: cashflow.payment_method_id, *.goal_id, personalAssets.liability_id
// and cashflow.recurringId all point at ids in sibling tables, and any
// regeneration would leave every one of them dangling. It also means
// restoring is idempotent — the same file twice gives the same database,
// where the per-domain importers would duplicate everything.
export async function importAll(file: BackupFile): Promise<number> {
  let restored = 0;
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = file.tables[table.name];
      if (Array.isArray(rows) && rows.length) {
        await table.bulkPut(rows);
        restored += rows.length;
      }
    }
    await ensureSeededFlag();
    // The file's own settings snapshot was taken just before its timestamp
    // was written, so restoring it would otherwise report "never backed up"
    // on a database that plainly was. The file's date is also the honest
    // answer on a new device: restoring is not itself a backup, and data
    // restored from a six-month-old file really is six months exposed.
    if (file.exportedAt) {
      await db.settings.put({ key: LAST_BACKUP_KEY, value: file.exportedAt });
    }
  });
  return restored;
}

export async function wipeAll(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
    await ensureSeededFlag();
  });
}

// seedIfEmpty() treats a missing "seeded" flag as a fresh install and fills
// the database with sample data. Clearing the settings table takes that
// flag with it, so without this an emptied app would quietly repopulate
// itself with demo rows on the next load — and a restored backup that
// predates the flag would do the same.
async function ensureSeededFlag(): Promise<void> {
  const seeded = await db.settings.get(SEEDED_KEY);
  if (!seeded) await db.settings.put({ key: SEEDED_KEY, value: true });
}

export async function markBackedUp(at: Date = new Date()): Promise<void> {
  await db.settings.put({ key: LAST_BACKUP_KEY, value: at.toISOString() });
}

/** Whole days since the given ISO timestamp, or null if never/unparseable. */
export function daysSince(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (isNaN(then.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86400000));
}
