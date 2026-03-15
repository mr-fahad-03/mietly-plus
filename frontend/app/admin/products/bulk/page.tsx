"use client";

import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  createBrand,
  createCategory,
  createProduct,
  fetchAdminBrands,
  fetchAdminCategoryTree,
  uploadProductImage,
} from "@/lib/api";
import { Brand, Category } from "@/lib/types";

type ProductCreatePayload = Parameters<typeof createProduct>[1];

type BulkProductInput = Omit<ProductCreatePayload, "brandId" | "categoryId"> & {
  brandId?: string;
  categoryId?: string;
  subcategoryId?: string;
  category?: string;
  categoryDe?: string;
  subcategory?: string;
  subcategoryDe?: string;
};

type CategoryResolutionResult = {
  categoryId: string;
  createdCategory: boolean;
  createdSubcategory: boolean;
};

type SheetRow = Record<string, string | number | boolean | null | undefined>;

const REQUIRED_COLUMNS = ["titleEn", "slug", "imageKey", "monthlyPrice"];
const OPTIONAL_RELATION_COLUMNS = ["brand", "brandId", "category", "categoryId", "subcategory", "subcategoryId"];

const TEMPLATE_HEADERS = [
  "titleEn",
  "titleDe",
  "slug",
  "shortDescriptionEn",
  "shortDescriptionDe",
  "descriptionEn",
  "descriptionDe",
  "imageKey",
  "galleryImageKeys",
  "sku",
  "brand",
  "brandId",
  "category",
  "categoryDe",
  "subcategory",
  "subcategoryDe",
  "categoryId",
  "subcategoryId",
  "tags",
  "monthlyPrice",
  "buyerPrice",
  "offerPrice",
  "depositEnabled",
  "securityDeposit",
  "replacementValue",
  "minimumRentalMonths",
  "maximumRentalMonths",
  "rentalPeriodUnit",
  "minimumRentalValue",
  "maximumRentalValue",
  "stock",
  "stockStatus",
  "lowStockWarning",
  "maxRentalQuantity",
  "unit",
  "weightKg",
  "refundable",
  "specifications",
  "isMostPopular",
  "isActive",
];

const TEMPLATE_SAMPLE = [
  "Gaming Laptop Rental",
  "Gaming Laptop Vermietung",
  "gaming-laptop-rental",
  "RTX laptop with flexible rental plans.",
  "RTX Laptop mit flexiblen Mietplaenen.",
  "<p>Powerful laptop for gaming and creative work.</p>",
  "<p>Leistungsstarkes Laptop fuer Gaming und Kreativarbeit.</p>",
  "laptop-main",
  "laptop-gallery-1,laptop-gallery-2",
  "LAP-RTX-001",
  "Lenovo",
  "",
  "Computers",
  "Computer",
  "Gaming Laptops",
  "Gaming Laptops",
  "",
  "",
  "gaming,laptop,student",
  "29.99",
  "49.99",
  "29.99",
  "true",
  "1000",
  "1299",
  "1",
  "24",
  "week",
  "1",
  "2",
  "10",
  "in_stock",
  "3",
  "2",
  "piece",
  "2.4",
  "true",
  "CPU:Intel Core i7|RAM:16GB|Storage:512GB SSD",
  "true",
  "true",
];

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toLookup(value: unknown): string {
  return toStringValue(value).toLowerCase();
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value: unknown, fallback?: number): number | undefined {
  const raw = toStringValue(value);
  if (!raw) return fallback;
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

function parseBoolean(value: unknown, fallback?: boolean): boolean | undefined {
  const raw = toStringValue(value).toLowerCase();
  if (!raw) return fallback;
  if (["true", "1", "yes", "y"].includes(raw)) return true;
  if (["false", "0", "no", "n"].includes(raw)) return false;
  return fallback;
}

function parseCommaList(value: unknown): string[] {
  return toStringValue(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(value: unknown): Array<{ key: string; value: string }> {
  const raw = toStringValue(value);
  if (!raw) return [];
  return raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(":");
      return { key: key?.trim() || "", value: rest.join(":").trim() };
    })
    .filter((item) => item.key && item.value);
}

function convertToDays(value: number, unit: "day" | "week" | "month") {
  if (unit === "day") return value;
  if (unit === "week") return value * 7;
  return value * 30;
}

function normalizeRow(row: SheetRow) {
  const normalized: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key.trim()] = value;
  });
  return normalized;
}

function fileKeyFromName(name: string) {
  return name.replace(/\.[^/.]+$/, "").trim().toLowerCase();
}

function mapRowToProduct(row: SheetRow, uploadedImages: Map<string, string>): BulkProductInput {
  const raw = normalizeRow(row);
  const imageKey = toStringValue(raw.imageKey).toLowerCase();
  const galleryKeys = parseCommaList(raw.galleryImageKeys).map((item) => item.toLowerCase());
  const unit = (toStringValue(raw.rentalPeriodUnit) || "week") as "day" | "week" | "month";
  const minRentalValue = parseNumber(raw.minimumRentalValue, 1) || 1;
  const maxRentalValue = parseNumber(raw.maximumRentalValue, 2) || 2;
  const depositEnabled = parseBoolean(raw.depositEnabled, false) || false;

  return {
    title: toStringValue(raw.titleEn),
    titleI18n: {
      en: toStringValue(raw.titleEn),
      de: toStringValue(raw.titleDe),
    },
    slug: toStringValue(raw.slug),
    description: toStringValue(raw.descriptionEn),
    descriptionI18n: {
      en: toStringValue(raw.descriptionEn),
      de: toStringValue(raw.descriptionDe),
    },
    shortDescription: toStringValue(raw.shortDescriptionEn),
    shortDescriptionI18n: {
      en: toStringValue(raw.shortDescriptionEn),
      de: toStringValue(raw.shortDescriptionDe),
    },
    imageUrl: uploadedImages.get(imageKey) || "",
    galleryImages: galleryKeys.map((key) => uploadedImages.get(key) || "").filter(Boolean),
    sku: toStringValue(raw.sku),
    brand: toStringValue(raw.brand),
    brandId: toStringValue(raw.brandId),
    category: toStringValue(raw.category),
    categoryDe: toStringValue(raw.categoryDe),
    subcategory: toStringValue(raw.subcategory),
    subcategoryDe: toStringValue(raw.subcategoryDe),
    categoryId: toStringValue(raw.categoryId),
    subcategoryId: toStringValue(raw.subcategoryId),
    tags: parseCommaList(raw.tags),
    monthlyPrice: Number(toStringValue(raw.monthlyPrice)),
    buyerPrice: parseNumber(raw.buyerPrice, 0),
    offerPrice: parseNumber(raw.offerPrice, 0),
    depositEnabled,
    securityDeposit: depositEnabled ? parseNumber(raw.securityDeposit, 0) : 0,
    replacementValue: parseNumber(raw.replacementValue, 0),
    minimumRentalMonths: parseNumber(raw.minimumRentalMonths, 1),
    maximumRentalMonths: parseNumber(raw.maximumRentalMonths, 24),
    rentalPeriodUnit: unit,
    minimumRentalDays: convertToDays(minRentalValue, unit),
    maximumRentalDays: convertToDays(maxRentalValue, unit),
    stock: parseNumber(raw.stock, 0),
    stockStatus: (toStringValue(raw.stockStatus) || "in_stock") as BulkProductInput["stockStatus"],
    lowStockWarning: parseNumber(raw.lowStockWarning, 5),
    maxRentalQuantity: parseNumber(raw.maxRentalQuantity, 1),
    unit: toStringValue(raw.unit) || "piece",
    weightKg: parseNumber(raw.weightKg, 0),
    refundable: parseBoolean(raw.refundable, true),
    specifications: parseSpecifications(raw.specifications),
    isMostPopular: parseBoolean(raw.isMostPopular, false),
    isActive: parseBoolean(raw.isActive, true),
  };
}

function validateProduct(product: BulkProductInput, rowNumber: number): string | null {
  if (!product.title) return `Row ${rowNumber}: titleEn is required.`;
  if (!product.slug) return `Row ${rowNumber}: slug is required.`;
  if (!product.imageUrl) return `Row ${rowNumber}: imageKey does not match any uploaded image file.`;
  if (!product.brandId && !product.brand) return `Row ${rowNumber}: brand or brandId is required.`;
  if (!product.categoryId && !product.category && !product.subcategoryId) {
    return `Row ${rowNumber}: category/categoryId (or subcategoryId) is required.`;
  }
  if (!Number.isFinite(product.monthlyPrice)) return `Row ${rowNumber}: monthlyPrice must be a valid number.`;
  if ((product.minimumRentalDays || 1) > (product.maximumRentalDays || 1)) {
    return `Row ${rowNumber}: minimum rental cannot be greater than maximum rental.`;
  }
  return null;
}

function flattenCategoryTree(categories: Category[]): Category[] {
  const result: Category[] = [];
  const walk = (nodes: Category[]) => {
    nodes.forEach((node) => {
      result.push(node);
      if (node.children?.length) walk(node.children);
    });
  };
  walk(categories);
  return result;
}

function findCategoryById(categories: Category[], categoryId: string): Category | null {
  if (!categoryId) return null;
  const all = flattenCategoryTree(categories);
  return all.find((item) => item.id === categoryId) || null;
}

function matchesCategory(category: Category, lookup: string) {
  return (
    toLookup(category.name.en) === lookup ||
    toLookup(category.name.de) === lookup ||
    toLookup(category.slug) === lookup
  );
}

function findRootCategoryByLookup(categories: Category[], lookup: string): Category | null {
  if (!lookup) return null;
  return categories.find((item) => !item.parentId && matchesCategory(item, lookup)) || null;
}

function findSubcategoryByLookup(parent: Category, lookup: string): Category | null {
  if (!lookup) return null;
  return (parent.children || []).find((child) => matchesCategory(child, lookup)) || null;
}

function addCategoryToTree(categories: Category[], category: Category): Category[] {
  const nodeToInsert: Category = {
    ...category,
    children: category.children || [],
  };

  if (!nodeToInsert.parentId) {
    return [...categories, nodeToInsert];
  }

  const walk = (nodes: Category[]): Category[] =>
    nodes.map((node) => {
      if (node.id === nodeToInsert.parentId) {
        return {
          ...node,
          children: [...(node.children || []), nodeToInsert],
        };
      }
      if (node.children?.length) {
        return { ...node, children: walk(node.children) };
      }
      return node;
    });

  return walk(categories);
}

function uniqueSlugFromExisting(baseValue: string, existingSlugs: Set<string>) {
  const base = toSlug(baseValue) || "item";
  let candidate = base;
  let index = 2;
  while (existingSlugs.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

async function ensureBrandId(
  product: BulkProductInput,
  rowNumber: number,
  adminToken: string,
  brandCache: { items: Brand[] }
): Promise<{ brandId: string; created: boolean }> {
  const directId = toStringValue(product.brandId);
  if (directId) return { brandId: directId, created: false };

  const brandName = toStringValue(product.brand);
  if (!brandName) {
    throw new Error(`Row ${rowNumber}: brand or brandId is required.`);
  }

  const lookup = toLookup(brandName);
  const existing = brandCache.items.find(
    (item) => toLookup(item.name) === lookup || toLookup(item.slug) === lookup
  );
  if (existing) {
    return { brandId: existing.id, created: false };
  }

  const existingSlugs = new Set(brandCache.items.map((item) => toLookup(item.slug)));
  const slug = uniqueSlugFromExisting(brandName, existingSlugs);

  try {
    const created = await createBrand(adminToken, {
      name: brandName,
      slug,
      isActive: true,
      image: null,
    });
    brandCache.items = [...brandCache.items, created];
    return { brandId: created.id, created: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create brand.";
    if (message.toLowerCase().includes("already exists")) {
      const refreshed = await fetchAdminBrands(adminToken);
      brandCache.items = refreshed;
      const recovered = refreshed.find(
        (item) => toLookup(item.name) === lookup || toLookup(item.slug) === lookup
      );
      if (recovered) return { brandId: recovered.id, created: false };
    }
    throw new Error(`Row ${rowNumber}: ${message}`);
  }
}

async function ensureCategoryId(
  product: BulkProductInput,
  rowNumber: number,
  adminToken: string,
  categoryCache: { items: Category[] }
): Promise<CategoryResolutionResult> {
  const directSubcategoryId = toStringValue(product.subcategoryId);
  if (directSubcategoryId) {
    return { categoryId: directSubcategoryId, createdCategory: false, createdSubcategory: false };
  }

  const directCategoryId = toStringValue(product.categoryId);
  const categoryLookup = toLookup(product.category);
  const subcategoryLookup = toLookup(product.subcategory);

  let parentCategory: Category | null = null;
  let createdCategory = false;

  if (directCategoryId) {
    const fromId = findCategoryById(categoryCache.items, directCategoryId);
    if (fromId && !fromId.parentId) {
      parentCategory = fromId;
    }
    if (fromId && fromId.parentId && !subcategoryLookup) {
      return { categoryId: fromId.id, createdCategory: false, createdSubcategory: false };
    }
    if (!fromId && !categoryLookup && !subcategoryLookup) {
      return { categoryId: directCategoryId, createdCategory: false, createdSubcategory: false };
    }
  }

  if (!parentCategory) {
    if (!categoryLookup) {
      throw new Error(`Row ${rowNumber}: category/categoryId is required.`);
    }

    const existingParent = findRootCategoryByLookup(categoryCache.items, categoryLookup);
    if (existingParent) {
      parentCategory = existingParent;
    } else {
      const existingSlugs = new Set(flattenCategoryTree(categoryCache.items).map((item) => toLookup(item.slug)));
      const slug = uniqueSlugFromExisting(toStringValue(product.category), existingSlugs);
      const parentPayload = {
        name: {
          en: toStringValue(product.category),
          de: toStringValue(product.categoryDe) || toStringValue(product.category),
        },
        slug,
        image: null,
        parentId: null,
      };
      try {
        const createdParent = (await createCategory(parentPayload, adminToken)) as Category;
        categoryCache.items = addCategoryToTree(categoryCache.items, createdParent);
        parentCategory = createdParent;
        createdCategory = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create category.";
        if (message.toLowerCase().includes("already exists")) {
          const refreshed = await fetchAdminCategoryTree(adminToken);
          categoryCache.items = refreshed;
          const recovered = findRootCategoryByLookup(refreshed, categoryLookup);
          if (recovered) {
            parentCategory = recovered;
          } else {
            throw new Error(`Row ${rowNumber}: ${message}`);
          }
        } else {
          throw new Error(`Row ${rowNumber}: ${message}`);
        }
      }
    }
  }

  if (!parentCategory) {
    throw new Error(`Row ${rowNumber}: Could not resolve category.`);
  }

  if (!subcategoryLookup) {
    return {
      categoryId: parentCategory.id,
      createdCategory,
      createdSubcategory: false,
    };
  }

  const existingChild = findSubcategoryByLookup(parentCategory, subcategoryLookup);
  if (existingChild) {
    return {
      categoryId: existingChild.id,
      createdCategory,
      createdSubcategory: false,
    };
  }

  const existingSlugs = new Set(flattenCategoryTree(categoryCache.items).map((item) => toLookup(item.slug)));
  const childSlug = uniqueSlugFromExisting(toStringValue(product.subcategory), existingSlugs);
  const childPayload = {
    name: {
      en: toStringValue(product.subcategory),
      de: toStringValue(product.subcategoryDe) || toStringValue(product.subcategory),
    },
    slug: childSlug,
    image: null,
    parentId: parentCategory.id,
  };

  try {
    const createdChild = (await createCategory(childPayload, adminToken)) as Category;
    categoryCache.items = addCategoryToTree(categoryCache.items, createdChild);
    return {
      categoryId: createdChild.id,
      createdCategory,
      createdSubcategory: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create subcategory.";
    if (message.toLowerCase().includes("already exists")) {
      const refreshed = await fetchAdminCategoryTree(adminToken);
      categoryCache.items = refreshed;
      const recoveredParent =
        findCategoryById(refreshed, parentCategory.id) ||
        findRootCategoryByLookup(refreshed, categoryLookup);
      const recoveredChild = recoveredParent ? findSubcategoryByLookup(recoveredParent, subcategoryLookup) : null;
      if (recoveredChild) {
        return {
          categoryId: recoveredChild.id,
          createdCategory,
          createdSubcategory: false,
        };
      }
    }
    throw new Error(`Row ${rowNumber}: ${message}`);
  }
}

function toCsvCell(value: unknown): string {
  const stringValue = toStringValue(value);
  if (!stringValue) return "";
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCreatePayload(
  product: BulkProductInput,
  brandId: string,
  categoryId: string
): ProductCreatePayload {
  const payload = {
    ...product,
    brandId,
    categoryId,
  } as Record<string, unknown>;

  delete payload.category;
  delete payload.categoryDe;
  delete payload.subcategory;
  delete payload.subcategoryDe;
  delete payload.subcategoryId;

  return payload as ProductCreatePayload;
}

export default function AdminBulkProductsPage() {
  const [fileName, setFileName] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<Map<string, string>>(new Map());
  const [parsedRows, setParsedRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const preview = useMemo(() => parsedRows.slice(0, 5), [parsedRows]);

  const onSheetChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setError("");
    setParsedRows([]);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("No sheet found in uploaded file.");
      const rows = XLSX.utils.sheet_to_json<SheetRow>(firstSheet, { defval: "" });
      if (!rows.length) throw new Error("Sheet is empty.");
      const first = normalizeRow(rows[0]);
      const missing = REQUIRED_COLUMNS.filter((col) => !(col in first));
      if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}`);
      setParsedRows(rows);
      setMessage(`${rows.length} rows parsed. Upload product images and click Import.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse file.");
    }
  };

  const onImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const adminToken = localStorage.getItem("admin_token") || "";
    if (!adminToken) {
      setError("Admin token missing. Please login again.");
      return;
    }
    if (!files.length) return;

    setUploadingImages(true);
    setMessage("");
    setError("");
    try {
      const map = new Map(uploadedImages);
      for (const file of files) {
        const key = fileKeyFromName(file.name);
        const url = await uploadProductImage(file, adminToken);
        map.set(key, url);
      }
      setUploadedImages(map);
      setImageCount(map.size);
      setMessage(`${files.length} image(s) uploaded. Total mapped images: ${map.size}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingImages(false);
    }
  };

  const onImport = async () => {
    const adminToken = localStorage.getItem("admin_token") || "";
    if (!adminToken) {
      setError("Admin token missing. Please login again.");
      return;
    }
    if (!parsedRows.length) {
      setError("Upload CSV/Excel file first.");
      return;
    }
    if (!uploadedImages.size) {
      setError("Upload product images first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const rowsWithMeta = parsedRows.map((row, index) => ({
        rowNumber: index + 2,
        product: mapRowToProduct(row, uploadedImages),
      }));

      for (const row of rowsWithMeta) {
        const validationError = validateProduct(row.product, row.rowNumber);
        if (validationError) throw new Error(validationError);
      }

      const [initialBrands, initialCategories] = await Promise.all([
        fetchAdminBrands(adminToken),
        fetchAdminCategoryTree(adminToken),
      ]);
      const brandCache = { items: initialBrands };
      const categoryCache = { items: initialCategories };

      let successCount = 0;
      let createdBrands = 0;
      let createdCategories = 0;
      let createdSubcategories = 0;

      for (const row of rowsWithMeta) {
        const brandResult = await ensureBrandId(row.product, row.rowNumber, adminToken, brandCache);
        if (brandResult.created) createdBrands += 1;

        const categoryResult = await ensureCategoryId(
          row.product,
          row.rowNumber,
          adminToken,
          categoryCache
        );
        if (categoryResult.createdCategory) createdCategories += 1;
        if (categoryResult.createdSubcategory) createdSubcategories += 1;

        const payload = buildCreatePayload(
          row.product,
          brandResult.brandId,
          categoryResult.categoryId
        );
        await createProduct(adminToken, payload);
        successCount += 1;
      }

      setMessage(
        `${successCount} products imported successfully. Created ${createdBrands} brand(s), ${createdCategories} category(ies), ${createdSubcategories} subcategory(ies).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk import failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "products");
    XLSX.writeFile(workbook, "rental-products-template.xlsx");
  };

  const downloadSampleCsv = () => {
    const rows = [TEMPLATE_HEADERS, TEMPLATE_SAMPLE];
    const csvContent = rows.map((row) => row.map((cell) => toCsvCell(cell)).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rental-products-sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-bold text-zinc-900">Add Bulk Products</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upload CSV/Excel + upload images separately, then import.
      </p>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Required columns</p>
        <p className="mt-1">{REQUIRED_COLUMNS.join(", ")}</p>
        <p className="mt-2">
          Product relation columns: {OPTIONAL_RELATION_COLUMNS.join(", ")}. Use names to auto-create missing brand/category/subcategory.
        </p>
        <p className="mt-2">
          `imageKey` and `galleryImageKeys` must match uploaded image file names (without extension).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Download Sample CSV
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Download Excel Template
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-800">1) Upload CSV/Excel</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onSheetChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white"
          />
          {fileName ? <p className="mt-1 text-xs text-zinc-600">Selected: {fileName}</p> : null}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-800">2) Upload Images</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onImagesChange}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lime-500 file:px-3 file:py-1 file:text-white"
          />
          <p className="mt-1 text-xs text-zinc-600">Mapped images: {imageCount}</p>
          {uploadingImages ? <p className="mt-1 text-xs text-zinc-500">Uploading images...</p> : null}
        </div>
      </div>

      {preview.length ? (
        <div className="mt-4 overflow-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                {Object.keys(normalizeRow(preview[0])).map((key) => (
                  <th key={key} className="whitespace-nowrap border-b border-zinc-200 px-3 py-2 font-semibold">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-white even:bg-zinc-50/40">
                  {Object.keys(normalizeRow(preview[0])).map((key) => (
                    <td
                      key={`${rowIndex}-${key}`}
                      className="max-w-[220px] truncate border-b border-zinc-100 px-3 py-2 text-zinc-700"
                    >
                      {toStringValue(normalizeRow(row)[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4">
        <button
          type="button"
          onClick={onImport}
          disabled={loading || uploadingImages || !parsedRows.length}
          className="rounded-xl bg-lime-500 px-5 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Importing..." : "Import Products"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-lime-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
