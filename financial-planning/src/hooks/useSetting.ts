"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

// Reads a single key from the settings table reactively, with a default
// while the DB hasn't resolved yet (SSR pass / first paint).
export function useSetting<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const value = useLiveQuery(async () => {
    const row = await db.settings.get(key);
    return row ? (row.value as T) : defaultValue;
  }, [key]);

  const set = (next: T) => {
    void db.settings.put({ key, value: next });
  };

  return [value === undefined ? defaultValue : value, set];
}
