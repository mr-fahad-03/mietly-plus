"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  createBanner,
  deleteBanner,
  fetchAdminBanners,
  uploadBannerImage,
} from "@/lib/api";
import { Banner } from "@/lib/types";

type BannerForm = {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  position: string;
  device: "desktop" | "mobile";
  sortOrder: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

const initialForm: BannerForm = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  buttonText: "Shop Now",
  buttonLink: "/shop",
  position: "home",
  device: "desktop",
  sortOrder: "0",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AdminBannersPage() {
  const [adminToken, setAdminToken] = useState("");
  const [form, setForm] = useState<BannerForm>(initialForm);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBanners = async (token: string) => {
    const data = await fetchAdminBanners(token);
    setBanners(data);
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    setAdminToken(token);
    if (!token) return;
    loadBanners(token).catch(() => setError("Could not fetch banners."));
  }, []);

  const onBannerImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

    setUploading(true);
    setMessage("");
    setError("");
    try {
      const imageUrl = await uploadBannerImage(file, adminToken);
      setForm((prev) => ({ ...prev, imageUrl }));
      setMessage("Banner image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload banner image.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToken) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (!isValidUrl(form.imageUrl.trim())) {
        throw new Error("Banner Image URL must be a valid direct image URL.");
      }

      await createBanner(adminToken, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        buttonText: form.buttonText.trim(),
        buttonLink: form.buttonLink.trim(),
        position: form.position.trim(),
        device: form.device,
        sortOrder: Number(form.sortOrder) || 0,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        isActive: form.isActive,
      });
      setMessage("Banner created successfully.");
      setForm(initialForm);
      await loadBanners(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create banner.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (bannerId: string) => {
    if (!adminToken) return;
    if (!window.confirm("Delete this banner?")) return;
    setMessage("");
    setError("");
    try {
      await deleteBanner(adminToken, bannerId);
      setMessage("Banner deleted.");
      await loadBanners(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete banner.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Add New Banner</h1>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Subtitle</span>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-700">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Banner Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Upload Banner Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={onBannerImageSelect}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white"
              />
              {uploading ? <p className="mt-1 text-xs text-zinc-500">Uploading...</p> : null}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Button Text</span>
              <input
                value={form.buttonText}
                onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Button Link</span>
              <input
                value={form.buttonLink}
                onChange={(e) => setForm((p) => ({ ...p, buttonLink: e.target.value }))}
                placeholder="/shop or https://..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Position</span>
              <select
                value={form.position}
                onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              >
                <option value="home">Home</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Sort Order</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Valid From</span>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-700">Valid Until</span>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-lime-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div>
              <p className="mb-2 text-sm text-zinc-700">Banner Device</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="device"
                    value="desktop"
                    checked={form.device === "desktop"}
                    onChange={() => setForm((p) => ({ ...p, device: "desktop" }))}
                  />
                  Desktop
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="device"
                    value="mobile"
                    checked={form.device === "mobile"}
                    onChange={() => setForm((p) => ({ ...p, device: "mobile" }))}
                  />
                  Mobile
                </label>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="rounded-xl bg-lime-500 px-5 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create Banner"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-lime-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">Current Banners</h2>
        <div className="mt-4 space-y-3">
          {banners.length === 0 ? <p className="text-sm text-zinc-500">No banners yet.</p> : null}
          {banners.map((banner) => (
            <div key={banner.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 p-3">
              <img src={banner.imageUrl} alt={banner.title} className="h-14 w-24 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-zinc-900">{banner.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      banner.device === "desktop"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {banner.device === "desktop" ? "Desktop" : "Mobile"}
                  </span>
                </div>
                <p className="truncate text-xs text-zinc-500">{banner.buttonLink || "-"}</p>
                <p className="text-xs text-zinc-500">
                  {banner.device} | order {banner.sortOrder} | {banner.isActive ? "active" : "inactive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(banner.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
