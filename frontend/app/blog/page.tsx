import type { Metadata } from "next";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { BlogListClient } from "@/components/blog/blog-list-client";
import { BlogPost } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export const metadata: Metadata = {
  title: "Blog | MietlyPlus",
  description: "Insights, rental tips, and product guides from MietlyPlus.",
  alternates: {
    canonical: `${SITE_BASE_URL}/blog`,
  },
  openGraph: {
    title: "Blog | MietlyPlus",
    description: "Insights, rental tips, and product guides from MietlyPlus.",
    url: `${SITE_BASE_URL}/blog`,
    type: "website",
  },
};

async function getBlogs() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blogs`, { cache: "no-store" });
    if (!response.ok) return [];
    return (await response.json()) as BlogPost[];
  } catch {
    return [];
  }
}

export default async function BlogListPage() {
  const posts = await getBlogs();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dff1f6_0%,#f8fcfd_40%,#ffffff_75%)]">
      <ClientNavbar />
      <BlogListClient posts={posts} />
      <HomeFooter />
    </div>
  );
}
