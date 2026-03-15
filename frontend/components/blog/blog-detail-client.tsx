"use client";

import Link from "next/link";
import { useSiteLocale } from "@/lib/use-site-locale";
import { BlogPost } from "@/lib/types";

function pickLocalizedValue(value: { en?: string; de?: string }, locale: "en" | "de") {
  if (locale === "de") return value.de || value.en || "";
  return value.en || value.de || "";
}

function formatDate(value: string | null, locale: "en" | "de") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

const copy = {
  en: {
    back: "Back to blog",
    minutes: "min read",
  },
  de: {
    back: "Zurueck zum Blog",
    minutes: "Min. Lesezeit",
  },
};

export function BlogDetailClient({ post }: { post: BlogPost }) {
  const { locale } = useSiteLocale("de");
  const text = copy[locale];
  const title = pickLocalizedValue(post.titleI18n, locale) || post.slug;
  const excerpt = pickLocalizedValue(post.excerptI18n, locale);
  const contentHtml = pickLocalizedValue(post.contentHtmlI18n, locale);
  const publishedAt = formatDate(post.publishedAt, locale);

  return (
    <main className="mx-auto w-full max-w-[980px] px-4 pb-14 pt-10">
      <Link
        href="/blog"
        className="inline-flex rounded-full border border-[rgb(73,153,173)] px-3 py-1.5 text-sm font-semibold text-[rgb(73,153,173)] transition hover:bg-[rgba(73,153,173,0.1)]"
      >
        {text.back}
      </Link>

      <article className="mt-5 rounded-[28px] border border-[rgba(73,153,173,0.24)] bg-white p-7 shadow-[0_24px_60px_rgba(20,30,50,0.08)] md:p-10">
        <h1 className="text-3xl font-black leading-tight text-zinc-900 md:text-5xl">{title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span>{publishedAt}</span>
          <span>
            {Math.max(0, Number(post.readingTimeMinutes) || 0)} {text.minutes}
          </span>
        </div>
        {excerpt ? <p className="mt-5 text-lg leading-8 text-zinc-700">{excerpt}</p> : null}

        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={title} className="mt-6 w-full rounded-2xl object-cover" />
        ) : null}

        <div
          className="seo-content mt-8 space-y-4 text-[15px] leading-7 text-zinc-700"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </main>
  );
}
