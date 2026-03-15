import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { BlogDetailClient } from "@/components/blog/blog-detail-client";
import { BlogPost } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blogs/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as BlogPost;
  } catch {
    return null;
  }
}

function fallbackTitle(post: BlogPost) {
  return post.titleI18n.en || post.titleI18n.de || post.slug;
}

function fallbackDescription(post: BlogPost) {
  return post.excerptI18n.en || post.excerptI18n.de || "MietlyPlus blog post";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const post = await getBlogBySlug(resolved.slug);
  if (!post) {
    return {
      title: "Blog Post | MietlyPlus",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = post.seo?.metaTitle || fallbackTitle(post);
  const description = post.seo?.metaDescription || fallbackDescription(post);
  const canonical = post.seo?.canonicalUrl || `${SITE_BASE_URL}/blog/${post.slug}`;
  const ogTitle = post.seo?.ogTitle || title;
  const ogDescription = post.seo?.ogDescription || description;
  const ogImage = post.seo?.ogImageUrl || post.coverImageUrl || undefined;

  return {
    title,
    description,
    keywords: post.seo?.metaKeywords || [],
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : [],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const post = await getBlogBySlug(resolved.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dff1f6_0%,#f8fcfd_40%,#ffffff_75%)]">
      <ClientNavbar />
      <BlogDetailClient post={post} />
      <HomeFooter />
    </div>
  );
}
