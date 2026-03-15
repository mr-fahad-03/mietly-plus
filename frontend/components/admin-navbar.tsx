"use client";

import Link from "next/link";
import { useState } from "react";
import { Locale } from "@/lib/types";

const adminCopy = {
  en: {
    title: "Admin Panel",
    categories: "Categories",
    storefront: "Storefront",
  },
  de: {
    title: "Admin Bereich",
    categories: "Kategorien",
    storefront: "Storefront",
  },
};

export function AdminNavbar() {
  const [locale, setLocale] = useState<Locale>("en");

  return (
    <header className="sticky top-0 z-20 border-t-4 border-lime-500 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-lime-500" />
          <p className="text-xl font-bold text-black">{adminCopy[locale].title}</p>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold text-zinc-700">
          <button
            type="button"
            className="rounded-full border border-zinc-300 px-3 py-1"
            onClick={() => setLocale((v) => (v === "en" ? "de" : "en"))}
          >
            {locale.toUpperCase()}
          </button>
          <Link href="/admin/categories" className="text-lime-600">
            {adminCopy[locale].categories}
          </Link>
          <Link href="/">{adminCopy[locale].storefront}</Link>
        </div>
      </div>
    </header>
  );
}
