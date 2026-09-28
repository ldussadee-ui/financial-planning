"use client";

import { useSyncExternalStore } from "react";

// One place for handing a JSON export to the user, used by the full backup
// and both family-sharing exports. It used to be three copies of the same
// download helper; sharing makes the logic less trivial, so it lives here.

export type ExportOutcome = "shared" | "downloaded" | "cancelled";

function toFile(filename: string, data: unknown, pretty: boolean): File {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  return new File([json], filename, { type: "application/json" });
}

export function downloadJson(filename: string, data: unknown, pretty = false): void {
  const url = URL.createObjectURL(toFile(filename, data, pretty));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Opens the system share sheet (LINE, mail, AirDrop, Files…) with the file.
// Dismissing the sheet is not an error and saves nothing. Any other failure
// falls back to a download so the tap is never wasted — most likely the
// browser refusing because building the file outlasted the tap's
// permission window, which Safari is strict about.
export async function shareJson(filename: string, data: unknown, pretty = false): Promise<ExportOutcome> {
  const file = toFile(filename, data, pretty);
  try {
    await navigator.share({ files: [file], title: filename });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    downloadJson(filename, data, pretty);
    return "downloaded";
  }
}

function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File(["{}"], "probe.json", { type: "application/json" })] });
  } catch {
    return false;
  }
}

const subscribeNever = () => () => {};

/** Whether this browser can put a file in the share sheet. False while
 *  hydrating, so the server markup (download button only) matches. */
export function useCanShareFiles(): boolean {
  return useSyncExternalStore(subscribeNever, canShareFiles, () => false);
}
