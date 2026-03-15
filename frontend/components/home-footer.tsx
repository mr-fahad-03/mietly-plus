"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchCategoryTree } from "@/lib/api";
import { useSiteLocale } from "@/lib/use-site-locale";
import { Category } from "@/lib/types";

const copy = {
  en: {
    company: "Company",
    offerings: "Offerings",
    info: "Info",
    language: "English",
    ask: "Got a question or need support?",
    getInTouch: "Get in Touch",
    rights: "Mietly Deutschland GmbH (c) 2026",
    cookie: "Cookie settings",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    imprint: "Imprint",
    helpCenter: "Help Center",
    blog: "Blog",
    reviewsLabel: "Reviews",
    howItWorks: "How It Works",
    greatConditionPromise: "Great Condition Promise",
    mietlyCare: "Mietly Care",
    sustainability: "Sustainability",
    cancellationPolicy: "Cancellation Policy",
    rentalContract: "Rental Contract",
    topCategories: "Top Categories",
  },
  de: {
    company: "Unternehmen",
    offerings: "Angebote",
    info: "Infos",
    language: "Deutsch",
    ask: "Haben Sie eine Frage oder brauchen Sie Hilfe?",
    getInTouch: "Kontakt",
    rights: "Mietly Deutschland GmbH (c) 2026",
    cookie: "Cookie-Einstellungen",
    privacy: "Datenschutz",
    terms: "AGB",
    imprint: "Impressum",
    helpCenter: "Hilfecenter",
    blog: "Blog",
    reviewsLabel: "Bewertungen",
    howItWorks: "So funktioniert’s",
    greatConditionPromise: "Qualitätsversprechen",
    mietlyCare: "Mietly Care",
    sustainability: "Nachhaltigkeit",
    cancellationPolicy: "Widerrufsrecht",
    rentalContract: "Mietvertrag",
    topCategories: "Top-Kategorien",
  },
};

function FooterIconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
    </svg>
  );
}

function FooterIconChevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function FooterSocialIcon({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(73,153,173,0.35)] bg-[rgba(73,153,173,0.10)] text-[11px] font-bold text-[rgb(73,153,173)]">
      {label}
    </span>
  );
}

export function HomeFooter() {
  const { locale, setLocale } = useSiteLocale("de");
  const text = useMemo(() => copy[locale], [locale]);
  const [topCategories, setTopCategories] = useState<Category[]>([]);

  const openCookieSettings = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("mietly-open-cookie-settings"));
  };

  useEffect(() => {
    fetchCategoryTree()
      .then((data) => setTopCategories(data.filter((item) => !item.parentId).slice(0, 8)))
      .catch(() => setTopCategories([]));
  }, []);

  return (
    <footer className="mt-6 border-t border-[rgba(73,153,173,0.22)] bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1fr_280px]">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-[0.15em] text-[rgb(73,153,173)]">{text.company}</h4>
            <ul className="mt-5 space-y-3 text-sm text-zinc-800">
              <li>
                <Link href="/help-center?source=help-center" className="transition hover:text-[rgb(73,153,173)]">
                  {text.helpCenter}
                </Link>
              </li>
              <li><Link href="/blog" className="transition hover:text-[rgb(73,153,173)]">{text.blog}</Link></li>
              <li><Link href="/company/reviews" className="transition hover:text-[rgb(73,153,173)]">{text.reviewsLabel}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-[0.15em] text-[rgb(73,153,173)]">{text.offerings}</h4>
            <ul className="mt-5 space-y-3 text-sm text-zinc-800">
              <li>
                <span className="font-semibold text-[rgb(73,153,173)]">{text.topCategories}</span>
              </li>
              {topCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/shop?category=${category.slug}`} className="transition hover:text-[rgb(73,153,173)]">
                    {category.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-[0.15em] text-[rgb(73,153,173)]">{text.info}</h4>
            <ul className="mt-5 space-y-3 text-sm text-zinc-800">
              <li><Link href="/info/how-it-works" className="transition hover:text-[rgb(73,153,173)]">{text.howItWorks}</Link></li>
              <li><Link href="/info/great-condition-promise" className="transition hover:text-[rgb(73,153,173)]">{text.greatConditionPromise}</Link></li>
              <li><Link href="/info/mietly-care" className="transition hover:text-[rgb(73,153,173)]">{text.mietlyCare}</Link></li>
              <li><Link href="/info/sustainability" className="transition hover:text-[rgb(73,153,173)]">{text.sustainability}</Link></li>
              <li><Link href="/help-center?source=help-center" className="transition hover:text-[rgb(73,153,173)]">{text.helpCenter}</Link></li>
              <li><Link href="/info/cancellation-policy" className="transition hover:text-[rgb(73,153,173)]">{text.cancellationPolicy}</Link></li>
              <li><Link href="/info/rental-contract" className="transition hover:text-[rgb(73,153,173)]">{text.rentalContract}</Link></li>
              <li><Link href="/info/privacy-policy" className="transition hover:text-[rgb(73,153,173)]">{text.privacy}</Link></li>
              <li><Link href="/info/terms-and-conditions" className="transition hover:text-[rgb(73,153,173)]">{text.terms}</Link></li>
              <li><Link href="/info/imprint" className="transition hover:text-[rgb(73,153,173)]">{text.imprint}</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "de" : "en")}
              className="flex w-full items-center justify-between rounded-full border border-[rgba(73,153,173,0.35)] bg-white px-4 py-3 text-sm font-medium text-[rgb(60,138,158)]"
            >
              <span className="inline-flex items-center gap-2">
                <FooterIconGlobe />
                {text.language}
              </span>
              <FooterIconChevron />
            </button>
          </div>
        </div>

        <div className="mt-9 border-t border-[rgba(73,153,173,0.22)] pt-7">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <p className="text-sm font-medium text-zinc-700">{text.ask}</p>
            <Link
              href="/help-center?source=get-in-touch#get-in-touch"
              className="rounded-full border border-[rgb(73,153,173)] bg-[rgb(73,153,173)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[rgb(60,138,158)]"
            >
              {text.getInTouch}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(73,153,173,0.22)] bg-white">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-700">
            <p>{text.rights}</p>
            <div className="flex items-center gap-3">
              <FooterSocialIcon label="f" />
              <FooterSocialIcon label="ig" />
              <FooterSocialIcon label="yt" />
              <FooterSocialIcon label="x" />
              <FooterSocialIcon label="in" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={openCookieSettings} className="hover:text-[rgb(73,153,173)]">
                {text.cookie}
              </button>
              <Link href="/info/privacy-policy#privacy" className="hover:text-[rgb(73,153,173)]">{text.privacy}</Link>
              <Link href="/info/terms-and-conditions#terms" className="hover:text-[rgb(73,153,173)]">{text.terms}</Link>
              <Link href="/info/imprint#imprint" className="hover:text-[rgb(73,153,173)]">{text.imprint}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
