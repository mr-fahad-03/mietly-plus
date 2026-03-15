"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createProduct, fetchAdminBrands, fetchAdminCategoryTree, uploadProductImage } from "@/lib/api";
import RichTextEditor from "@/components/admin/rich-text-editor";
import CategoryCascadeSelect from "@/components/admin/category-cascade-select";
import { Brand, Category } from "@/lib/types";

type ProductForm = {
  titleEn: string;
  titleDe: string;
  slug: string;
  sku: string;
  brandId: string;
  shortDescriptionEn: string;
  shortDescriptionDe: string;
  descriptionEn: string;
  descriptionDe: string;
  imageUrl: string;
  galleryImagesText: string;
  categoryId: string;
  monthlyPrice: string;
  buyerPrice: string;
  offerPrice: string;
  stock: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "preorder";
  lowStockWarning: string;
  maxRentalQuantity: string;
  minimumRentalWeeks: string;
  maximumRentalWeeks: string;
  minimumRentalMonths: string;
  maximumRentalMonths: string;
  deliveryFee: string;
  verificationRequired: boolean;
  depositEnabled: boolean;
  securityDeposit: string;
  replacementValue: string;
  unit: string;
  weightKg: string;
  tagsText: string;
  specificationsText: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoMetaKeywords: string;
  seoCanonicalUrl: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImageUrl: string;
  isMostPopular: boolean;
  refundable: boolean;
  isActive: boolean;
};

const initialForm: ProductForm = {
  titleEn: "",
  titleDe: "",
  slug: "",
  sku: "",
  brandId: "",
  shortDescriptionEn: "",
  shortDescriptionDe: "",
  descriptionEn: "<p></p>",
  descriptionDe: "<p></p>",
  imageUrl: "",
  galleryImagesText: "",
  categoryId: "",
  monthlyPrice: "",
  buyerPrice: "",
  offerPrice: "",
  stock: "0",
  stockStatus: "in_stock",
  lowStockWarning: "5",
  maxRentalQuantity: "1",
  minimumRentalWeeks: "1",
  maximumRentalWeeks: "2",
  minimumRentalMonths: "1",
  maximumRentalMonths: "24",
  deliveryFee: "4.90",
  verificationRequired: true,
  depositEnabled: false,
  securityDeposit: "0",
  replacementValue: "0",
  unit: "piece",
  weightKg: "0",
  tagsText: "",
  specificationsText: "",
  seoMetaTitle: "",
  seoMetaDescription: "",
  seoMetaKeywords: "",
  seoCanonicalUrl: "",
  seoOgTitle: "",
  seoOgDescription: "",
  seoOgImageUrl: "",
  isMostPopular: false,
  refundable: true,
  isActive: true,
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(":");
      return { key: key?.trim() || "", value: rest.join(":").trim() };
    })
    .filter((item) => item.key && item.value);
}

function calculateDiscountPercent(buyerPrice: number, offerPrice: number) {
  if (buyerPrice <= 0 || offerPrice <= 0 || offerPrice >= buyerPrice) return 0;
  return Math.round(((buyerPrice - offerPrice) / buyerPrice) * 100);
}

export default function AdminAddProductsPage() {
  const [adminToken, setAdminToken] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const buyerPriceNumber = Number(form.buyerPrice || "0");
  const offerPriceNumber = Number(form.offerPrice || "0");
  const discountPercent = calculateDiscountPercent(buyerPriceNumber, offerPriceNumber);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";
    setAdminToken(token);
    if (!token) return;
    Promise.all([fetchAdminCategoryTree(token), fetchAdminBrands(token)])
      .then(([categoryData, brandData]) => {
        setCategories(categoryData);
        setBrands(brandData);
      })
      .catch(() => setError("Could not fetch categories/brands."));
  }, []);

  const onUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const imageUrl = await uploadProductImage(file, adminToken);
      setForm((prev) => ({ ...prev, imageUrl }));
      setMessage("Product image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToken) return;

    const minWeeks = Number(form.minimumRentalWeeks || "0");
    const maxWeeks = Number(form.maximumRentalWeeks || "0");
    const minMonths = Number(form.minimumRentalMonths || "0");
    const maxMonths = Number(form.maximumRentalMonths || "0");
    if (minWeeks > maxWeeks) {
      setError("Minimum rental weeks cannot be greater than maximum rental weeks.");
      return;
    }
    if (minMonths > maxMonths) {
      setError("Minimum rental months cannot be greater than maximum rental months.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      await createProduct(adminToken, {
        title: form.titleEn.trim(),
        titleI18n: { en: form.titleEn.trim(), de: form.titleDe.trim() },
        slug: form.slug.trim(),
        description: form.descriptionEn,
        descriptionI18n: { en: form.descriptionEn, de: form.descriptionDe },
        shortDescription: form.shortDescriptionEn,
        shortDescriptionI18n: { en: form.shortDescriptionEn, de: form.shortDescriptionDe },
        imageUrl: form.imageUrl.trim(),
        galleryImages: parseCommaList(form.galleryImagesText),
        sku: form.sku.trim(),
        brandId: form.brandId,
        tags: parseCommaList(form.tagsText),
        categoryId: form.categoryId,
        monthlyPrice: Number(form.monthlyPrice),
        buyerPrice: Number(form.buyerPrice || "0"),
        offerPrice: Number(form.offerPrice || "0"),
        stock: Number(form.stock || "0"),
        stockStatus: form.stockStatus,
        lowStockWarning: Number(form.lowStockWarning || "5"),
        maxRentalQuantity: Number(form.maxRentalQuantity || "1"),
        unit: form.unit.trim() || "piece",
        weightKg: Number(form.weightKg || "0"),
        minimumRentalWeeks: Number(form.minimumRentalWeeks || "1"),
        maximumRentalWeeks: Number(form.maximumRentalWeeks || "2"),
        minimumRentalMonths: Number(form.minimumRentalMonths || "1"),
        maximumRentalMonths: Number(form.maximumRentalMonths || "24"),
        minimumRentalDays: Number(form.minimumRentalWeeks || "1") * 7,
        maximumRentalDays: Number(form.maximumRentalWeeks || "2") * 7,
        rentalPeriodUnit: "week",
        deliveryFee: Number(form.deliveryFee || "0"),
        verificationRequired: form.verificationRequired,
        depositEnabled: form.depositEnabled,
        securityDeposit: form.depositEnabled ? Number(form.securityDeposit || "0") : 0,
        replacementValue: Number(form.replacementValue || "0"),
        refundable: form.refundable,
        specifications: parseSpecifications(form.specificationsText),
        seo: {
          metaTitle: form.seoMetaTitle.trim(),
          metaDescription: form.seoMetaDescription.trim(),
          metaKeywords: parseCommaList(form.seoMetaKeywords),
          canonicalUrl: form.seoCanonicalUrl.trim(),
          ogTitle: form.seoOgTitle.trim(),
          ogDescription: form.seoOgDescription.trim(),
          ogImageUrl: form.seoOgImageUrl.trim(),
        },
        isMostPopular: form.isMostPopular,
        isActive: form.isActive,
      });
      setMessage("Rental product created successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">Rental product form with EN/DE content, rental period and deposit logic.</p>
        <Link href="/admin/products/list" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">
          Go to Product List
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Add New Rental Product</h1>
        <form className="mt-4 space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm">Product Name (EN)</span><input value={form.titleEn} onChange={(e)=>setForm((p)=>({...p,titleEn:e.target.value}))} required className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Product Name (DE)</span><input value={form.titleDe} onChange={(e)=>setForm((p)=>({...p,titleDe:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block"><span className="mb-1 block text-sm">Slug</span><input value={form.slug} onChange={(e)=>setForm((p)=>({...p,slug:e.target.value}))} required className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">SKU</span><input value={form.sku} onChange={(e)=>setForm((p)=>({...p,sku:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block">
              <span className="mb-1 block text-sm">Brand</span>
              <select value={form.brandId} onChange={(e)=>setForm((p)=>({...p,brandId:e.target.value}))} required className="w-full rounded-lg border border-zinc-300 px-3 py-2">
                <option value="">Select brand</option>
                {brands.filter((brand) => brand.isActive).map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm">Short Description (EN)</span><textarea rows={2} value={form.shortDescriptionEn} onChange={(e)=>setForm((p)=>({...p,shortDescriptionEn:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Short Description (DE)</span><textarea rows={2} value={form.shortDescriptionDe} onChange={(e)=>setForm((p)=>({...p,shortDescriptionDe:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><span className="mb-1 block text-sm text-zinc-700">Long Description (EN) - Tiptap</span><RichTextEditor value={form.descriptionEn} onChange={(value)=>setForm((p)=>({...p,descriptionEn:value}))} adminToken={adminToken} /></div>
            <div><span className="mb-1 block text-sm text-zinc-700">Long Description (DE) - Tiptap</span><RichTextEditor value={form.descriptionDe} onChange={(value)=>setForm((p)=>({...p,descriptionDe:value}))} adminToken={adminToken} /></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm">Category</span>
              <CategoryCascadeSelect
                categories={categories}
                value={form.categoryId}
                onChange={(categoryId) => setForm((p) => ({ ...p, categoryId }))}
              />
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Main image will be set from upload. {form.imageUrl ? "Uploaded." : "Not uploaded yet."}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm">Upload Main Image</span><input type="file" accept="image/*" onChange={onUploadImage} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white"/>{uploading ? <p className="mt-1 text-xs text-zinc-500">Uploading...</p> : null}</label>
            <label className="block"><span className="mb-1 block text-sm">Gallery URLs (comma-separated)</span><input value={form.galleryImagesText} onChange={(e)=>setForm((p)=>({...p,galleryImagesText:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
          </div>

          <div className="rounded-xl border border-lime-200 bg-lime-50/40 p-4">
            <p className="mb-3 font-semibold text-zinc-900">Pricing</p>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="block"><span className="mb-1 block text-sm">Weekly Buyer Price (cut price)</span><input type="number" min="0" step="0.01" value={form.buyerPrice} onChange={(e)=>setForm((p)=>({...p,buyerPrice:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
              <label className="block"><span className="mb-1 block text-sm">Weekly Offer Price</span><input type="number" min="0" step="0.01" value={form.offerPrice} onChange={(e)=>setForm((p)=>({...p,offerPrice:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
              <label className="block"><span className="mb-1 block text-sm">Monthly Rental Price</span><input type="number" step="0.01" value={form.monthlyPrice} onChange={(e)=>setForm((p)=>({...p,monthlyPrice:e.target.value}))} required className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
              <label className="block"><span className="mb-1 block text-sm">Delivery Fee (EUR)</span><input type="number" min="0" step="0.01" value={form.deliveryFee} onChange={(e)=>setForm((p)=>({...p,deliveryFee:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            </div>
            <div className="mt-3 inline-flex items-center rounded-full border border-lime-200 bg-white px-3 py-1 text-sm font-semibold text-lime-700">
              Auto Discount: {discountPercent > 0 ? `-${discountPercent}%` : "0%"}
            </div>
            <p className="mt-2 text-xs text-zinc-500">Weekly mode uses Weekly Buyer/Offer prices. Monthly mode uses Monthly Rental Price.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block"><span className="mb-1 block text-sm">Stock</span><input type="number" value={form.stock} onChange={(e)=>setForm((p)=>({...p,stock:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Low Stock Warning</span><input type="number" value={form.lowStockWarning} onChange={(e)=>setForm((p)=>({...p,lowStockWarning:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Stock Status</span><select value={form.stockStatus} onChange={(e)=>setForm((p)=>({...p,stockStatus:e.target.value as ProductForm["stockStatus"]}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option><option value="preorder">Preorder</option></select></label>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="mb-3 font-semibold">Rental Period (calendar-style duration)</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm">Min Rental (weeks)</span><input type="number" min="1" value={form.minimumRentalWeeks} onChange={(e)=>setForm((p)=>({...p,minimumRentalWeeks:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
              <label className="block"><span className="mb-1 block text-sm">Max Rental (weeks)</span><input type="number" min="1" value={form.maximumRentalWeeks} onChange={(e)=>setForm((p)=>({...p,maximumRentalWeeks:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Customers will see both options on product page: rent by week and rent by month.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="block"><span className="mb-1 block text-sm">Min Rental (months)</span><input type="number" min="1" value={form.minimumRentalMonths} onChange={(e)=>setForm((p)=>({...p,minimumRentalMonths:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Max Rental (months)</span><input type="number" min="1" value={form.maximumRentalMonths} onChange={(e)=>setForm((p)=>({...p,maximumRentalMonths:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Max Rental Qty</span><input type="number" min="1" value={form.maxRentalQuantity} onChange={(e)=>setForm((p)=>({...p,maxRentalQuantity:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Unit</span><input value={form.unit} onChange={(e)=>setForm((p)=>({...p,unit:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="mb-3 grid gap-2 md:max-w-sm">
              <span className="text-sm font-semibold text-zinc-800">Verification Required</span>
              <select
                value={form.verificationRequired ? "yes" : "no"}
                onChange={(e) => setForm((p) => ({ ...p, verificationRequired: e.target.value === "yes" }))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="yes">Yes (mandatory)</option>
                <option value="no">No (not required)</option>
              </select>
              <p className="text-xs text-zinc-500">
                If set to No, checkout will hide verification for this product.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.depositEnabled} onChange={(e)=>setForm((p)=>({...p,depositEnabled:e.target.checked}))}/>
              Enable deposit for this product
            </label>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <label className="block"><span className="mb-1 block text-sm">Deposit Amount</span><input type="number" min="0" step="0.01" disabled={!form.depositEnabled} value={form.securityDeposit} onChange={(e)=>setForm((p)=>({...p,securityDeposit:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:bg-zinc-100"/></label>
              <label className="block"><span className="mb-1 block text-sm">Replacement Value</span><input type="number" min="0" step="0.01" value={form.replacementValue} onChange={(e)=>setForm((p)=>({...p,replacementValue:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
              <label className="block"><span className="mb-1 block text-sm">Weight (kg)</span><input type="number" min="0" step="0.01" value={form.weightKg} onChange={(e)=>setForm((p)=>({...p,weightKg:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm">Tags (comma-separated)</span><input value={form.tagsText} onChange={(e)=>setForm((p)=>({...p,tagsText:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
            <label className="block"><span className="mb-1 block text-sm">Specifications (line: Key: Value)</span><textarea rows={3} value={form.specificationsText} onChange={(e)=>setForm((p)=>({...p,specificationsText:e.target.value}))} className="w-full rounded-lg border border-zinc-300 px-3 py-2"/></label>
          </div>

          <div className="rounded-xl border border-lime-200 bg-lime-50/40 p-4">
            <p className="mb-3 font-semibold text-zinc-900">SEO Settings</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.seoMetaTitle} onChange={(e)=>setForm((p)=>({...p,seoMetaTitle:e.target.value}))} placeholder="Meta Title" className="rounded-lg border border-zinc-300 px-3 py-2" />
              <input value={form.seoCanonicalUrl} onChange={(e)=>setForm((p)=>({...p,seoCanonicalUrl:e.target.value}))} placeholder="Canonical URL" className="rounded-lg border border-zinc-300 px-3 py-2" />
              <textarea rows={2} value={form.seoMetaDescription} onChange={(e)=>setForm((p)=>({...p,seoMetaDescription:e.target.value}))} placeholder="Meta Description" className="rounded-lg border border-zinc-300 px-3 py-2" />
              <input value={form.seoMetaKeywords} onChange={(e)=>setForm((p)=>({...p,seoMetaKeywords:e.target.value}))} placeholder="keyword1, keyword2" className="rounded-lg border border-zinc-300 px-3 py-2" />
              <input value={form.seoOgTitle} onChange={(e)=>setForm((p)=>({...p,seoOgTitle:e.target.value}))} placeholder="OG Title" className="rounded-lg border border-zinc-300 px-3 py-2" />
              <input value={form.seoOgImageUrl} onChange={(e)=>setForm((p)=>({...p,seoOgImageUrl:e.target.value}))} placeholder="OG Image URL" className="rounded-lg border border-zinc-300 px-3 py-2" />
              <textarea rows={2} value={form.seoOgDescription} onChange={(e)=>setForm((p)=>({...p,seoOgDescription:e.target.value}))} placeholder="OG Description" className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isMostPopular} onChange={(e)=>setForm((p)=>({...p,isMostPopular:e.target.checked}))}/>Add to Most Popular</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.refundable} onChange={(e)=>setForm((p)=>({...p,refundable:e.target.checked}))}/>Refundable</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm((p)=>({...p,isActive:e.target.checked}))}/>Active</label>
          </div>

          <button type="submit" disabled={loading || uploading} className="rounded-xl bg-lime-500 px-5 py-2 font-semibold text-white disabled:opacity-60">
            {loading ? "Saving..." : "Create Rental Product"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-lime-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>
    </div>
  );
}
