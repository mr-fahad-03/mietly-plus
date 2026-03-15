"use client";

import { useSyncExternalStore } from "react";
import { Locale } from "@/lib/types";

const STORAGE_KEY = "site_locale";
const EVENT_NAME = "site-locale-change";

function createLocaleStore(defaultLocale: Locale) {
  const getSnapshot = (): Locale => {
    if (typeof window === "undefined") return defaultLocale;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "de" ? saved : defaultLocale;
  };

  const getServerSnapshot = (): Locale => defaultLocale;

  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    const onLocaleChanged = () => callback();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) callback();
    };

    window.addEventListener(EVENT_NAME, onLocaleChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, onLocaleChanged);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { subscribe, getSnapshot, getServerSnapshot };
}

export function useSiteLocale(defaultLocale: Locale = "de") {
  const store = createLocaleStore(defaultLocale);
  const locale = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const setLocale = (nextLocale: Locale) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, nextLocale);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: nextLocale }));
  };

  return { locale, setLocale };
}
