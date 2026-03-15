"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createBrand, deleteBrand, fetchAdminBrands, uploadBrandImage } from "@/lib/api";
import { Brand } from "@/lib/types";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBrandsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBrands = async (token: string) => {
    const data = await fetchAdminBrands(token);
    setBrands(data);
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    setAdminToken(token);
    if (!token) return;
    loadBrands(token).catch(() => setError("Could not fetch brands."));
  }, []);

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const imageUrl = await uploadBrandImage(file, adminToken);
      setImage(imageUrl);
      setMessage("Brand image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload brand image.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToken) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await createBrand(adminToken, {
        name: name.trim(),
        slug: (slug.trim() || toSlug(name)).trim(),
        image: image.trim() || null,
        isActive: true,
      });
      setName("");
      setSlug("");
      setImage("");
      setMessage("Brand created successfully.");
      await loadBrands(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create brand.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (brandId: string) => {
    if (!adminToken) return;
    if (!window.confirm("Delete this brand?")) return;
    setError("");
    setMessage("");
    try {
      await deleteBrand(adminToken, brandId);
      setMessage("Brand deleted.");
      await loadBrands(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete brand.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Brands</h1>
        <p className="mt-1 text-sm text-zinc-600">Add brands with image and use them in product form.</p>

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-700">Brand Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-700">Slug</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-700">Image URL</span>
            <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-700">Upload Image</span>
            <input type="file" accept="image/*" onChange={onUpload} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white" />
            {uploading ? <p className="mt-1 text-xs text-zinc-500">Uploading...</p> : null}
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading || uploading} className="rounded-xl bg-lime-500 px-5 py-2 font-semibold text-white disabled:opacity-60">
              {loading ? "Saving..." : "Add Brand"}
            </button>
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-lime-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Current Brands</h2>
        <div className="mt-4 space-y-2">
          {brands.length === 0 ? <p className="text-sm text-zinc-500">No brands available.</p> : null}
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
              <img src={brand.image || "https://via.placeholder.com/80x50?text=Brand"} alt={brand.name} className="h-12 w-20 rounded object-contain bg-zinc-50 p-1" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">{brand.name}</p>
                <p className="text-xs text-zinc-500">{brand.slug}</p>
              </div>
              <button type="button" onClick={() => onDelete(brand.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600">
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
