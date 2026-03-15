"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import CategoryCascadeSelect from "@/components/admin/category-cascade-select";
import RichTextEditor from "@/components/admin/rich-text-editor";
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminCategoryTree,
  fetchAdminBlogs,
  updateBlogPost,
  uploadBlogImage,
} from "@/lib/api";
import { BlogPost, Category } from "@/lib/types";

type BlogForm = {
  titleEn: string;
  titleDe: string;
  excerptEn: string;
  excerptDe: string;
  contentEn: string;
  contentDe: string;
  categoryId: string;
  slug: string;
  coverImageUrl: string;
  tagsText: string;
  readingTimeMinutes: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoMetaKeywords: string;
  seoCanonicalUrl: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImageUrl: string;
  status: "draft" | "published";
};

const initialForm: BlogForm = {
  titleEn: "",
  titleDe: "",
  excerptEn: "",
  excerptDe: "",
  contentEn: "<p></p>",
  contentDe: "<p></p>",
  categoryId: "",
  slug: "",
  coverImageUrl: "",
  tagsText: "",
  readingTimeMinutes: "0",
  seoMetaTitle: "",
  seoMetaDescription: "",
  seoMetaKeywords: "",
  seoCanonicalUrl: "",
  seoOgTitle: "",
  seoOgDescription: "",
  seoOgImageUrl: "",
  status: "draft",
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminBlogsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [posts]
  );

  const loadPosts = async (token: string) => {
    const data = await fetchAdminBlogs(token);
    setPosts(data);
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    setAdminToken(token);
    if (!token) return;
    Promise.all([loadPosts(token), fetchAdminCategoryTree(token)])
      .then(([, categoryTree]) => setCategories(categoryTree))
      .catch(() => setError("Could not fetch blog data."));
  }, []);

  const resetForm = () => {
    setEditPostId(null);
    setForm(initialForm);
  };

  const onUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const imageUrl = await uploadBlogImage(file, adminToken);
      setForm((prev) => ({ ...prev, coverImageUrl: imageUrl }));
      setMessage("Blog image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToken) return;
    if (!form.categoryId) {
      setError("Category is required.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        categoryId: form.categoryId,
        titleI18n: {
          en: form.titleEn.trim(),
          de: form.titleDe.trim(),
        },
        excerptI18n: {
          en: form.excerptEn.trim(),
          de: form.excerptDe.trim(),
        },
        contentHtmlI18n: {
          en: form.contentEn,
          de: form.contentDe,
        },
        slug: form.slug.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        tags: parseCommaList(form.tagsText),
        readingTimeMinutes: Number(form.readingTimeMinutes || "0"),
        seo: {
          metaTitle: form.seoMetaTitle.trim(),
          metaDescription: form.seoMetaDescription.trim(),
          metaKeywords: parseCommaList(form.seoMetaKeywords),
          canonicalUrl: form.seoCanonicalUrl.trim(),
          ogTitle: form.seoOgTitle.trim(),
          ogDescription: form.seoOgDescription.trim(),
          ogImageUrl: form.seoOgImageUrl.trim(),
        },
        status: form.status,
      } as const;

      if (editPostId) {
        await updateBlogPost(adminToken, editPostId, payload);
        setMessage("Blog post updated successfully.");
      } else {
        await createBlogPost(adminToken, payload);
        setMessage("Blog post created successfully.");
      }

      resetForm();
      await loadPosts(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save blog post.");
    } finally {
      setLoading(false);
    }
  };

  const onStartEdit = (post: BlogPost) => {
    setEditPostId(post.id);
    setMessage("");
    setError("");
    setForm({
      titleEn: post.titleI18n.en || "",
      titleDe: post.titleI18n.de || "",
      excerptEn: post.excerptI18n.en || "",
      excerptDe: post.excerptI18n.de || "",
      contentEn: post.contentHtmlI18n.en || "<p></p>",
      contentDe: post.contentHtmlI18n.de || "<p></p>",
      categoryId: post.categoryId || "",
      slug: post.slug || "",
      coverImageUrl: post.coverImageUrl || "",
      tagsText: (post.tags || []).join(", "),
      readingTimeMinutes: String(post.readingTimeMinutes || 0),
      seoMetaTitle: post.seo?.metaTitle || "",
      seoMetaDescription: post.seo?.metaDescription || "",
      seoMetaKeywords: (post.seo?.metaKeywords || []).join(", "),
      seoCanonicalUrl: post.seo?.canonicalUrl || "",
      seoOgTitle: post.seo?.ogTitle || "",
      seoOgDescription: post.seo?.ogDescription || "",
      seoOgImageUrl: post.seo?.ogImageUrl || "",
      status: post.status === "published" ? "published" : "draft",
    });
  };

  const onDelete = async (post: BlogPost) => {
    if (!adminToken) return;
    if (!window.confirm(`Delete blog post "${post.titleI18n.en || post.slug}"?`)) return;

    setError("");
    setMessage("");
    try {
      await deleteBlogPost(adminToken, post.id);
      if (editPostId === post.id) {
        resetForm();
      }
      setMessage("Blog post deleted successfully.");
      await loadPosts(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete blog post.");
    }
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">
          {editPostId ? "Edit Blog Post" : "Add Blog Post"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage bilingual content, publish status, and SEO settings.
        </p>

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Title (EN)</span>
            <input
              value={form.titleEn}
              onChange={(e) => setForm((prev) => ({ ...prev, titleEn: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Title (DE)</span>
            <input
              value={form.titleDe}
              onChange={(e) => setForm((prev) => ({ ...prev, titleDe: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700">Category</span>
            <CategoryCascadeSelect
              categories={categories}
              value={form.categoryId}
              onChange={(categoryId) => setForm((prev) => ({ ...prev, categoryId }))}
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="example: smart-renting-guide"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Cover Image URL</span>
            <input
              value={form.coverImageUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Upload Cover Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onUploadImage}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white"
            />
            {uploading ? <p className="mt-1 text-xs text-zinc-500">Uploading image...</p> : null}
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Excerpt (EN)</span>
              <textarea
                rows={3}
                value={form.excerptEn}
                onChange={(e) => setForm((prev) => ({ ...prev, excerptEn: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Excerpt (DE)</span>
              <textarea
                rows={3}
                value={form.excerptDe}
                onChange={(e) => setForm((prev) => ({ ...prev, excerptDe: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700">Content (EN)</span>
            <RichTextEditor
              value={form.contentEn}
              onChange={(nextValue) => setForm((prev) => ({ ...prev, contentEn: nextValue }))}
              adminToken={adminToken}
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700">Content (DE)</span>
            <RichTextEditor
              value={form.contentDe}
              onChange={(nextValue) => setForm((prev) => ({ ...prev, contentDe: nextValue }))}
              adminToken={adminToken}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Tags</span>
              <input
                value={form.tagsText}
                onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                placeholder="rental, tips, germany"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Reading Time (minutes)</span>
              <input
                type="number"
                min={0}
                value={form.readingTimeMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, readingTimeMinutes: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value === "published" ? "published" : "draft",
                }))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="text-sm font-semibold text-zinc-900">SEO Fields</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={form.seoMetaTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, seoMetaTitle: e.target.value }))}
                placeholder="Meta Title"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
              <input
                value={form.seoCanonicalUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, seoCanonicalUrl: e.target.value }))}
                placeholder="Canonical URL"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
              <textarea
                rows={2}
                value={form.seoMetaDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, seoMetaDescription: e.target.value }))}
                placeholder="Meta Description"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
              <input
                value={form.seoMetaKeywords}
                onChange={(e) => setForm((prev) => ({ ...prev, seoMetaKeywords: e.target.value }))}
                placeholder="keyword1, keyword2"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
              <input
                value={form.seoOgTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, seoOgTitle: e.target.value }))}
                placeholder="OG Title"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
              <input
                value={form.seoOgImageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, seoOgImageUrl: e.target.value }))}
                placeholder="OG Image URL"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
              <textarea
                rows={2}
                value={form.seoOgDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, seoOgDescription: e.target.value }))}
                placeholder="OG Description"
                className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 rounded-xl bg-lime-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : editPostId ? "Update Blog Post" : "Create Blog Post"}
            </button>
            {editPostId ? (
              <button
                type="button"
                className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700"
                onClick={resetForm}
              >
                Cancel
              </button>
            ) : null}
          </div>

          {message ? <p className="text-sm text-lime-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">Current Blog Posts</h2>
        <p className="mt-1 text-sm text-zinc-500">Draft and published posts</p>

        <div className="mt-5 space-y-3">
          {sortedPosts.map((post) => (
            <article key={post.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-900">
                    {post.titleI18n.en || post.slug}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-500">{post.slug}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    Category: {post.category?.name.en || "Uncategorized"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {post.status === "published" ? "Published" : "Draft"}{" "}
                    {post.publishedAt ? `| ${new Date(post.publishedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onStartEdit(post)}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {sortedPosts.length === 0 ? (
            <p className="text-sm text-zinc-500">No blog posts yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
