"use client";

import { useMemo } from "react";
import { useSiteLocale } from "@/lib/use-site-locale";

const copy = {
  en: {
    eyebrow: "How It Works",
    title: "Rent in 3 simple steps",
    badge: "Fast and flexible",
    steps: [
      {
        number: "1",
        title: "Find what you need",
        body: "Browse the catalog or request a product that matches your needs.",
      },
      {
        number: "2",
        title: "Pick your rental plan",
        body: "Choose the rental period and complete checkout. Verification may apply to selected products.",
      },
      {
        number: "3",
        title: "Receive and return",
        body: "Get the product delivered, use it during the agreed period, and return it when you are done.",
      },
    ],
  },
  de: {
    eyebrow: "So funktioniert’s",
    title: "In 3 Schritten mieten",
    badge: "Schnell und flexibel",
    steps: [
      {
        number: "1",
        title: "Produkt finden",
        body: "Stöbere durch unser Sortiment oder stelle eine Anfrage für ein Produkt, das du suchst.",
      },
      {
        number: "2",
        title: "Mietoption wählen",
        body: "Wähle die passende Laufzeit und schließe die Bestellung ab. Bei bestimmten Produkten kann eine Verifizierung erforderlich sein.",
      },
      {
        number: "3",
        title: "Erhalten und zurückgeben",
        body: "Du bekommst das Produkt geliefert, nutzt es für den vereinbarten Zeitraum und gibst es anschließend unkompliziert zurück.",
      },
    ],
  },
};

export function HomeRentalSteps() {
  const { locale } = useSiteLocale("de");
  const text = useMemo(() => copy[locale], [locale]);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[rgb(73,153,173)]">{text.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-extrabold text-zinc-900 md:text-4xl">{text.title}</h2>
        </div>
        <div className="hidden rounded-full border border-[rgba(73,153,173,0.22)] bg-[rgba(73,153,173,0.10)] px-4 py-1 text-sm font-semibold text-[rgb(73,153,173)] md:block">
          {text.badge}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {text.steps.map((step) => (
          <article
            key={step.number}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-[rgba(73,153,173,0.14)] to-[rgba(86,165,184,0.10)]" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[rgb(73,153,173)] px-2 text-lg font-bold text-white">
                  {step.number}
                </span>
              </div>
              <h3 className="text-2xl font-bold leading-tight text-zinc-900">{step.title}</h3>
              <p className="mt-4 text-lg leading-8 text-zinc-600">{step.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
