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
    heading: "Blog",
    subheading: "Insights, rental tips, and product guides from MietlyPlus.",
    empty: "No blog posts published yet.",
    readMore: "Read more",
    minutes: "min read",
  },
  de: {
    heading: "Blog",
    subheading: "Einblicke, Miettipps und Produktleitfaeden von MietlyPlus.",
    empty: "Noch keine Blogbeitraege veroeffentlicht.",
    readMore: "Weiterlesen",
    minutes: "Min. Lesezeit",
  },
};

export function BlogListClient({ posts }: { posts: BlogPost[] }) {
  const { locale } = useSiteLocale("de");
  const text = copy[locale];

  return (
    <section className="mx-auto w-full max-w-[1160px] px-4 pb-14 pt-10">
      <div className="rounded-[28px] border border-[rgba(73,153,173,0.24)] bg-white p-7 shadow-[0_24px_60px_rgba(20,30,50,0.08)] md:p-10">
        <h1 className="text-3xl font-black text-zinc-900 md:text-5xl">{text.heading}</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 md:text-lg">{text.subheading}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const title = pickLocalizedValue(post.titleI18n, locale);
          const excerpt = pickLocalizedValue(post.excerptI18n, locale);
          const publishedAt = formatDate(post.publishedAt, locale);
          return (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_36px_-28px_rgba(24,24,27,0.5)]"
            >
              {post.coverImageUrl ? (
                <img src={post.coverImageUrl} alt={title || post.slug} className="h-44 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <h2 className="line-clamp-2 text-xl font-bold text-zinc-900">{title || post.slug}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{excerpt}</p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span>{publishedAt}</span>
                  <span>
                    {Math.max(0, Number(post.readingTimeMinutes) || 0)} {text.minutes}
                  </span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex rounded-full border border-[rgb(73,153,173)] px-3 py-1.5 text-sm font-semibold text-[rgb(73,153,173)] transition hover:bg-[rgba(73,153,173,0.1)]"
                >
                  {text.readMore}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <p className="mt-6 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          {text.empty}
        </p>
      ) : null}
    </section>
  );
}
