"use client";

import { useEffect } from "react";
import { db } from "@/lib/db";
import { runRecurringGeneration, type GeneratedEntryInfo } from "@/lib/recurring";

// Catches up recurring income/expense entries once per app session (there's
// no server/cron in this local-only app, so opening the app is the only
// trigger). Newly-created entries are recorded into a setting so the
// Cashflow tab can show a one-time "we added these for you" notice.
export function RecurringGenerator() {
  useEffect(() => {
    void (async () => {
      const created: GeneratedEntryInfo[] = await runRecurringGeneration();
      if (created.length) await db.settings.put({ key: "recurringGeneratedNotice", value: created });
    })();
  }, []);
  return null;
}
