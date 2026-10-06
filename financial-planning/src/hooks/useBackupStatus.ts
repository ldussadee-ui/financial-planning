"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { daysSince, LAST_BACKUP_KEY } from "@/lib/backup";

// Anything past this and the app starts nudging rather than just reporting.
// Roughly a month: long enough not to nag, short enough that a browser
// wiping its storage costs weeks of entries rather than years.
export const BACKUP_STALE_AFTER_DAYS = 30;

export interface BackupStatus {
  /** False until the database has answered — nothing should nag before then. */
  loaded: boolean;
  /** Whole days since the last full backup; null if there has never been one. */
  days: number | null;
  /** Never backed up, or not for BACKUP_STALE_AFTER_DAYS. */
  stale: boolean;
}

// One judgement of "is a backup overdue", shared by the Settings card, the
// overview's reminder and the dot on the settings icon, so they can't
// disagree. Unlike useSetting it reports loading separately: a default of
// "never" while the database opens would flash the reminder on every launch.
export function useBackupStatus(): BackupStatus {
  const lastBackup = useLiveQuery(async () => ((await db.settings.get(LAST_BACKUP_KEY))?.value as string | undefined) ?? null, []);
  if (lastBackup === undefined) return { loaded: false, days: null, stale: false };
  const days = daysSince(lastBackup);
  return { loaded: true, days, stale: days === null || days >= BACKUP_STALE_AFTER_DAYS };
}
