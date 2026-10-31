"use client";

import { useEffect } from "react";
import pkg from "../../package.json";

// An installed PWA is usually suspended rather than closed, so it can keep
// running the code it first loaded for days, long after a new release is
// live. When the app comes back to the foreground, ask the server which
// version is live and reload into it if it differs.
//
// It never reloads under an open form (a sheet with aria-modal), so a half
// typed entry isn't lost; it simply tries again on the next return to the
// app. Once per target version per session, so a deployment that hasn't
// reached every edge yet can't make it reload over and over.
const MIN_HIDDEN_MS = 30 * 1000;
const RELOADED_KEY = "fp-reloaded-for-version";

async function reloadIfOutdated() {
  try {
    const res = await fetch("/version", { cache: "no-store" });
    if (!res.ok) return;
    const { version } = (await res.json()) as { version?: string };
    if (!version || version === pkg.version) return;
    if (document.querySelector('[aria-modal="true"]')) return;
    try {
      if (sessionStorage.getItem(RELOADED_KEY) === version) return;
      sessionStorage.setItem(RELOADED_KEY, version);
    } catch {
      // Storage blocked: reload anyway, the next check finds the new version.
    }
    window.location.reload();
  } catch {
    // Offline: keep running the version we have.
  }
}

export function UpdateChecker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt >= MIN_HIDDEN_MS) void reloadIfOutdated();
        hiddenAt = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  return null;
}
