"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { useSiteLocale } from "@/lib/use-site-locale";

const pages = {
  jobs: {
    en: {
      title: "Jobs",
      body: "We are building the future of rental commerce. Join our team across operations, engineering, customer support, and logistics.",
    },
    de: {
      title: "Jobs",
      body: "Wir gestalten die Zukunft des Miet-Commerce. Werden Sie Teil unseres Teams in Operations, Engineering, Kundenservice und Logistik.",
    },
  },
  blog: {
    en: {
      title: "Blog",
      body: "Read guides, product updates, and rental tips to get the most value from Mietly.",
    },
    de: {
      title: "Blog",
      body: "Lesen Sie Ratgeber, Produkt-Updates und Miettipps, um den größten Nutzen aus Mietly zu ziehen.",
    },
  },
  press: {
    en: {
      title: "Press",
      body: "Press and media inquiries can be sent through our support contact form.",
    },
    de: {
      title: "Presse",
      body: "Presse- und Medienanfragen können über unser Support-Kontaktformular gesendet werden.",
    },
  },
  reviews: {
    en: {
      title: "Reviews",
      body: "Customer feedback helps us improve quality, delivery, and support every day.",
    },
    de: {
      title: "Bewertungen",
      body: "Kundenfeedback hilft uns, Qualität, Lieferung und Support kontinuierlich zu verbessern.",
    },
  },
} as const;

export default function CompanyPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? String(slugParam[0] || "") : String(slugParam || "");
  const { locale } = useSiteLocale("de");

  const content = useMemo(() => {
    const page = pages[slug as keyof typeof pages];
    return page ? page[locale] : null;
  }, [slug, locale]);

  return (
    <div className="min-h-screen bg-white">
      <ClientNavbar />
      <main className="mx-auto w-full max-w-[980px] px-4 py-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-7">
          {content ? (
            <>
              <h1 className="text-4xl font-extrabold text-zinc-900">{content.title}</h1>
              <p className="mt-4 text-lg leading-8 text-zinc-700">{content.body}</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-extrabold text-zinc-900">Page Not Found</h1>
              <p className="mt-4 text-lg leading-8 text-zinc-700">The requested company page does not exist.</p>
            </>
          )}
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

