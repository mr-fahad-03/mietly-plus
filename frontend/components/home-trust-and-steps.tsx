"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSiteLocale } from "@/lib/use-site-locale";

const copy = {
  en: {
    eyebrow: "MietlyPlus Highlights",
    title: "Built for flexible modern living",
    cta: "Learn more",
    cards: [
      {
        title: "How it works",
        text: "MietlyPlus gives you access to the products you need without the pressure of a permanent purchase.",
        href: "/info/how-it-works",
      },
      {
        title: "Great Condition Promise",
        text: "Every MietlyPlus product is checked and prepared before delivery for confident everyday use.",
        href: "/info/great-condition-promise",
      },
      {
        title: "Mietly Care",
        text: "From preparation and delivery to support and returns, we focus on reliability and simplicity.",
        href: "/info/mietly-care",
      },
      {
        title: "Sustainability",
        text: "Smarter consumption through responsible rental, care, and reuse of quality products.",
        href: "/info/sustainability",
      },
    ],
  },
  de: {
    eyebrow: "MietlyPlus Highlights",
    title: "Für flexibles modernes Leben gebaut",
    cta: "Mehr erfahren",
    cards: [
      {
        title: "So funktioniert’s",
        text: "Mit MietlyPlus nutzt du Produkte flexibel, ohne sie dauerhaft kaufen zu müssen. Einfach, flexibel und alltagstauglich.",
        href: "/info/how-it-works",
      },
      {
        title: "Unser Qualitätsversprechen",
        text: "Jedes Produkt von MietlyPlus wird vor dem Versand geprüft und vorbereitet. So stellen wir sicher, dass unsere Mietprodukte unseren Funktions- und Qualitätsstandards entsprechen.",
        href: "/info/great-condition-promise",
      },
      {
        title: "Mietly Care",
        text: "Mietly Care begleitet das gesamte Mieterlebnis – von der Vorbereitung und Lieferung bis hin zu Support und Rückgabe. Unser Ziel ist ein einfacher, verlässlicher und stressfreier Ablauf.",
        href: "/info/mietly-care",
      },
      {
        title: "Nachhaltigkeit",
        text: "MietlyPlus ermöglicht einen bewussteren Konsum, indem hochwertige Produkte länger sinnvoll genutzt, gepflegt und mehrfach eingesetzt werden.",
        href: "/info/sustainability",
      },
    ],
  },
};

export function HomeTrustAndSteps() {
  const { locale } = useSiteLocale("de");
  const text = useMemo(() => copy[locale], [locale]);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-14">
      <div className="rounded-3xl bg-gradient-to-b from-white to-[rgba(73,153,173,0.05)] p-6 md:p-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[rgb(73,153,173)]">{text.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-zinc-900 md:text-4xl">{text.title}</h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {text.cards.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_8px_24px_-16px_rgba(24,24,27,0.35)]"
            >
              <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
              <Link
                href={item.href}
                className="mt-4 inline-flex text-sm font-bold text-[rgb(73,153,173)] transition hover:text-[rgb(60,138,158)]"
              >
                {text.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
