"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  createCategory,
  deleteCategory,
  fetchAdminCategoryTree,
  updateCategory,
  uploadCategoryImage,
} from "@/lib/api";
import { Category } from "@/lib/types";
import RichTextEditor from "@/components/admin/rich-text-editor";

type FormState = {
  nameEn: string;
  nameDe: string;
  slug: string;
  image: string;
  parentId: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoMetaKeywords: string;
  seoCanonicalUrl: string;
  seoContentHtmlEn: string;
  seoContentHtmlDe: string;
};

const initialForm: FormState = {
  nameEn: "",
  nameDe: "",
  slug: "",
  image: "",
  parentId: "",
  seoMetaTitle: "",
  seoMetaDescription: "",
  seoMetaKeywords: "",
  seoCanonicalUrl: "",
  seoContentHtmlEn: "",
  seoContentHtmlDe: "",
};

export default function AdminCategoriesPage() {
  const [adminToken, setAdminToken] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCategories = async (token: string) => {
    const data = await fetchAdminCategoryTree(token);
    setCategories(data);
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    setAdminToken(token);
    if (!token) return;
    loadCategories(token).catch(() => {
      setError("Could not fetch categories.");
    });
  }, []);

  const parentOptions = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: {
          en: form.nameEn.trim(),
          de: form.nameDe.trim(),
        },
        slug: form.slug.trim(),
        image: form.image.trim() ? form.image.trim() : null,
        parentId: form.parentId || null,
        seo: {
          metaTitle: form.seoMetaTitle.trim(),
          metaDescription: form.seoMetaDescription.trim(),
          metaKeywords: form.seoMetaKeywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
          canonicalUrl: form.seoCanonicalUrl.trim(),
          contentHtml: {
            en: form.seoContentHtmlEn.trim(),
            de: form.seoContentHtmlDe.trim(),
          },
        },
      };

      if (editCategoryId) {
        await updateCategory(editCategoryId, payload, adminToken);
        setMessage("Category updated successfully.");
      } else {
        await createCategory(payload, adminToken);
        setMessage("Category created successfully.");
      }

      setEditCategoryId(null);
      setForm(initialForm);
      await loadCategories(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditCategoryId(category.id);
    setMessage("");
    setError("");
    setForm({
      nameEn: category.name.en,
      nameDe: category.name.de,
      slug: category.slug,
      image: category.image || "",
      parentId: category.parentId || "",
      seoMetaTitle: category.seo?.metaTitle || "",
      seoMetaDescription: category.seo?.metaDescription || "",
      seoMetaKeywords: Array.isArray(category.seo?.metaKeywords)
        ? category.seo?.metaKeywords.join(", ")
        : "",
      seoCanonicalUrl: category.seo?.canonicalUrl || "",
      seoContentHtmlEn: category.seo?.contentHtml?.en || "",
      seoContentHtmlDe: category.seo?.contentHtml?.de || "",
    });
  };

  const resetForm = () => {
    setEditCategoryId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  };

  const onDelete = async (category: Category, hasChildren: boolean) => {
    const confirmationText = hasChildren
      ? "This category has subcategories. Delete category and all subcategories?"
      : "Delete this category?";
    if (!window.confirm(confirmationText)) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await deleteCategory(category.id, {
        cascade: hasChildren,
        adminToken,
      });
      if (editCategoryId === category.id) {
        resetForm();
      }
      setMessage("Category deleted successfully.");
      await loadCategories(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete category.");
    }
  };

  const onImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const imageUrl = await uploadCategoryImage(file, adminToken);
      setForm((prev) => ({ ...prev, image: imageUrl }));
      setMessage("Image uploaded to Cloudinary.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-black">
            {editCategoryId ? "Edit Category / Subcategory" : "Add Category / Subcategory"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add category with optional image. Select parent to create subcategory.
          </p>

          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Name (EN)</span>
              <input
                value={form.nameEn}
                onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Name (DE)</span>
              <input
                value={form.nameDe}
                onChange={(e) => setForm((prev) => ({ ...prev, nameDe: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Slug</span>
              <input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="example: drones"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Image URL (optional)</span>
              <input
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">
                Upload image to Cloudinary (optional)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onImageSelected}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white"
              />
              {uploading ? <p className="mt-1 text-xs text-zinc-500">Uploading image...</p> : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Parent category (optional)</span>
              <select
                value={form.parentId}
                onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              >
                <option value="">None (Main category)</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id} disabled={category.id === editCategoryId}>
                    {category.name.en}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900">SEO Fields</h3>
              <p className="mt-1 text-xs text-zinc-500">These values are used on the shop page for this category/subcategory.</p>

              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">Meta Title</span>
                  <input
                    value={form.seoMetaTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, seoMetaTitle: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">Meta Description</span>
                  <textarea
                    value={form.seoMetaDescription}
                    onChange={(e) => setForm((prev) => ({ ...prev, seoMetaDescription: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">Meta Keywords (comma separated)</span>
                  <input
                    value={form.seoMetaKeywords}
                    onChange={(e) => setForm((prev) => ({ ...prev, seoMetaKeywords: e.target.value }))}
                    placeholder="camera rental, canon lens, studio gear"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">Canonical URL</span>
                  <input
                    value={form.seoCanonicalUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, seoCanonicalUrl: e.target.value }))}
                    placeholder="https://mietlyplus.de/shop?category=example"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
                  />
                </label>
              </div>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700">SEO Content (EN)</span>
              <RichTextEditor
                value={form.seoContentHtmlEn}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, seoContentHtmlEn: nextValue }))}
                placeholder="Write SEO content for this category in English..."
                adminToken={adminToken}
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700">SEO Content (DE)</span>
              <RichTextEditor
                value={form.seoContentHtmlDe}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, seoContentHtmlDe: nextValue }))}
                placeholder="Schreiben Sie den SEO-Inhalt fuer diese Kategorie auf Deutsch..."
                adminToken={adminToken}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-lime-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Saving..." : editCategoryId ? "Update category" : "Create category"}
              </button>
              {editCategoryId ? (
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
          <h2 className="text-2xl font-bold text-black">Current categories</h2>
          <p className="mt-1 text-sm text-zinc-500">10 seed main categories + subcategories</p>

          <div className="mt-6 space-y-5">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">{category.name.en}</p>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {category.slug}
                  </span>
                  {category.image ? (
                    <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs text-lime-800">Image</span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">No image</span>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    className="ml-auto rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(category, Boolean(category.children?.length))}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
                {category.children?.length ? (
                  <div className="mt-3 space-y-2">
                    {category.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                      >
                        <span className="text-sm text-zinc-700">{child.name.en}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(child)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(child, false)}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
    </div>
  );
}
