"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSiteLocale } from "@/lib/use-site-locale";

const COOKIE_CONSENT_STORAGE_KEY = "mietly_cookie_consent_v1";
const OPEN_COOKIE_SETTINGS_EVENT = "mietly-open-cookie-settings";

type CookieConsent = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  status: "accepted_all" | "denied_non_essential" | "customized";
  updatedAt: string;
};

const copy = {
  en: {
    popupTitle: "Cookie preferences",
    popupBody:
      "We use essential cookies to ensure the proper functioning, security, and performance of our website. Additional cookies for analytics or marketing will only be used with your consent.",
    acceptAll: "Accept all",
    rejectNonEssential: "Reject non-essential",
    cookieSettings: "Cookie settings",
    settingsTitle: "Cookie settings",
    settingsBody: "Manage your cookie preferences. Essential cookies are always enabled.",
    essential: "Essential",
    essentialDesc: "Required for security and core site functionality.",
    functional: "Functional",
    functionalDesc: "Remember language, preferences, and UI choices.",
    analytics: "Analytics",
    analyticsDesc: "Help us understand usage and improve the website.",
    marketing: "Marketing",
    marketingDesc: "Support personalized content and campaign measurement.",
    saveSettings: "Save settings",
    summaryOne: "Only essential cookies enabled",
    summaryTwo: "All cookie categories enabled",
    summaryMany: "optional categories enabled",
    policy: "Cookie policy",
  },
  de: {
    popupTitle: "Cookie-Hinweis",
    popupBody:
      "Wir verwenden essenzielle Cookies, um die ordnungsgemäße Funktion, Sicherheit und Leistung unserer Website sicherzustellen. Zusätzliche Cookies für Analyse- oder Marketingzwecke werden nur mit deiner Einwilligung verwendet.",
    acceptAll: "Alle akzeptieren",
    rejectNonEssential: "Nicht notwendige ablehnen",
    cookieSettings: "Cookie-Einstellungen",
    settingsTitle: "Cookie-Einstellungen",
    settingsBody: "Verwalte deine Cookie-Präferenzen. Essenzielle Cookies sind immer aktiv.",
    essential: "Essenziell",
    essentialDesc: "Erforderlich für Sicherheit und Kernfunktionen der Website.",
    functional: "Funktional",
    functionalDesc: "Speichert Sprache, Präferenzen und Oberflächeneinstellungen.",
    analytics: "Analyse",
    analyticsDesc: "Hilft uns, die Nutzung zu verstehen und die Website zu verbessern.",
    marketing: "Marketing",
    marketingDesc: "Unterstützt personalisierte Inhalte und Kampagnenmessung.",
    saveSettings: "Einstellungen speichern",
    summaryOne: "Nur essenzielle Cookies aktiv",
    summaryTwo: "Alle Cookie-Kategorien aktiv",
    summaryMany: "optionale Kategorien aktiv",
    policy: "Cookie-Richtlinie",
  },
};

function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      parsed.status !== "accepted_all" &&
      parsed.status !== "denied_non_essential" &&
      parsed.status !== "customized"
    ) {
      return null;
    }
    return {
      essential: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      status: parsed.status,
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

function persistConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    console.warn("Cookie consent could not be stored in localStorage:", error);
  }
  window.dispatchEvent(new CustomEvent("mietly-cookie-consent-change", { detail: consent }));
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-7 w-12 items-center rounded-full border p-1 transition ${
        checked ? "border-[rgb(73,153,173)] bg-[rgb(73,153,173)]" : "border-zinc-300 bg-zinc-200"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      aria-pressed={checked}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export function CookieConsentPopup() {
  const { locale } = useSiteLocale("de");
  const text = useMemo(() => copy[locale], [locale]);
  const initialConsent = useMemo(() => readStoredConsent(), []);
  const [open, setOpen] = useState(() => !initialConsent);
  const [settingsMode, setSettingsMode] = useState(false);
  const [functional, setFunctional] = useState(() => Boolean(initialConsent?.functional));
  const [analytics, setAnalytics] = useState(() => Boolean(initialConsent?.analytics));
  const [marketing, setMarketing] = useState(() => Boolean(initialConsent?.marketing));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOpenSettings = () => {
      const existing = readStoredConsent();
      if (existing) {
        setFunctional(existing.functional);
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
      }
      setSettingsMode(true);
      setOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
  }, []);

  const summary = useMemo(() => {
    const active = [functional, analytics, marketing].filter(Boolean).length;
    if (active === 0) return text.summaryOne;
    if (active === 3) return text.summaryTwo;
    return `${active} ${text.summaryMany}`;
  }, [functional, analytics, marketing, text.summaryMany, text.summaryOne, text.summaryTwo]);

  const acceptAll = () => {
    const consent: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      status: "accepted_all",
      updatedAt: new Date().toISOString(),
    };
    setFunctional(true);
    setAnalytics(true);
    setMarketing(true);
    setOpen(false);
    setSettingsMode(false);
    persistConsent(consent);
  };

  const denyNonEssential = () => {
    const consent: CookieConsent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      status: "denied_non_essential",
      updatedAt: new Date().toISOString(),
    };
    setFunctional(false);
    setAnalytics(false);
    setMarketing(false);
    setOpen(false);
    setSettingsMode(false);
    persistConsent(consent);
  };

  const saveCustomSettings = () => {
    const consent: CookieConsent = {
      essential: true,
      functional,
      analytics,
      marketing,
      status: "customized",
      updatedAt: new Date().toISOString(),
    };
    setOpen(false);
    setSettingsMode(false);
    persistConsent(consent);
  };

  if (!open) return null;

  if (settingsMode) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
        <section className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-[rgba(73,153,173,0.28)] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-extrabold text-zinc-900">{text.settingsTitle}</h2>
          <p className="mt-2 text-sm text-zinc-600">{text.settingsBody}</p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-semibold text-zinc-900">{text.essential}</p>
                <p className="text-xs text-zinc-600">{text.essentialDesc}</p>
              </div>
              <Toggle checked disabled onChange={() => {}} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-semibold text-zinc-900">{text.functional}</p>
                <p className="text-xs text-zinc-600">{text.functionalDesc}</p>
              </div>
              <Toggle checked={functional} onChange={setFunctional} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-semibold text-zinc-900">{text.analytics}</p>
                <p className="text-xs text-zinc-600">{text.analyticsDesc}</p>
              </div>
              <Toggle checked={analytics} onChange={setAnalytics} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-semibold text-zinc-900">{text.marketing}</p>
                <p className="text-xs text-zinc-600">{text.marketingDesc}</p>
              </div>
              <Toggle checked={marketing} onChange={setMarketing} />
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-[rgb(47,118,135)]">{summary}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveCustomSettings}
              className="rounded-lg bg-[rgb(73,153,173)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[rgb(60,138,158)]"
            >
              {text.saveSettings}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg border border-[rgb(73,153,173)] px-4 py-2 text-sm font-semibold text-[rgb(73,153,173)] transition hover:bg-[rgba(73,153,173,0.1)]"
            >
              {text.acceptAll}
            </button>
            <button
              type="button"
              onClick={denyNonEssential}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              {text.rejectNonEssential}
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            <Link href="/info/privacy-policy#cookies" className="font-semibold text-[rgb(73,153,173)] underline">
              {text.policy}
            </Link>
            .
          </p>
        </section>
      </div>
    );
  }

  return (
    <section className="pointer-events-auto fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-4xl rounded-2xl border border-[rgba(73,153,173,0.3)] bg-white p-4 shadow-xl md:inset-x-6 md:p-5">
      <p className="text-sm font-semibold text-zinc-900">{text.popupTitle}</p>
      <p className="mt-1 text-sm text-zinc-600">{text.popupBody}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={acceptAll}
          className="rounded-lg bg-[rgb(73,153,173)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[rgb(60,138,158)]"
        >
          {text.acceptAll}
        </button>
        <button
          type="button"
          onClick={denyNonEssential}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          {text.rejectNonEssential}
        </button>
        <button
          type="button"
          onClick={() => setSettingsMode(true)}
          className="rounded-lg border border-[rgb(73,153,173)] px-4 py-2 text-sm font-semibold text-[rgb(73,153,173)] transition hover:bg-[rgba(73,153,173,0.1)]"
        >
          {text.cookieSettings}
        </button>
      </div>
    </section>
  );
}
