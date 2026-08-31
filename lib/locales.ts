"use client";
// lib/locales.ts
// ─────────────────────────────────────────────────────────────────────
// Simple i18n hook — reads localStorage lang choice, returns strings.
// ─────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import en from "../locales/en.json";
import mr from "../locales/mr.json";
import hi from "../locales/hi.json";

export type Lang = "en" | "mr" | "hi";
export const LANG_KEY = "zcoer_lang";

const locales: Record<Lang, Record<string, string>> = { en, mr, hi };

export function useLocale() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (localStorage.getItem(LANG_KEY) as Lang) || "en";
    setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = locales[lang][key] || locales["en"][key] || key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return { lang, setLang, t };
}

/** Server-safe helper — returns english by default */
export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem(LANG_KEY) as Lang) || "en";
}
