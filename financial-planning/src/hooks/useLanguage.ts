"use client";

import { useSetting } from "./useSetting";
import type { Language } from "@/lib/i18n";

// Backed by the same reactive settings table as every other setting, so
// any component calling this re-renders on a language change without
// needing a React context/provider.
export function useLanguage() {
  const [lang, setLang] = useSetting<Language>("language", "th");
  const t = <K extends { th: string; en: string }>(entry: K): string => entry[lang];
  return { lang, setLang, t };
}
