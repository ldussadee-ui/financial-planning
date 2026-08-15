"use client";

import { useEffect } from "react";
import { seedIfEmpty } from "@/lib/db";

// Seeds the local IndexedDB with sample data on first run only. Runs once
// on mount; seedIfEmpty() itself is idempotent (guarded by a settings flag).
export function DbInit() {
  useEffect(() => {
    void seedIfEmpty();
    if ("storage" in navigator && "persist" in navigator.storage) {
      void navigator.storage.persist();
    }
  }, []);
  return null;
}
