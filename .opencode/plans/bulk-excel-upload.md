# Bulk Excel Upload Implementation

## 1. `backend/models/Product.js` — Add fields

After `monthlyOfferPrice` block (line ~97), insert:

```js
    weeklyAutoDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    monthlyAutoDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
```

## 2. `backend/index.js` — Add to create route

After `monthlyOfferPrice = 0,` (line ~1990), add:

```js
    weeklyAutoDiscount = 0,
    monthlyAutoDiscount = 0,
```

After `monthlyOfferPrice: Number(monthlyOfferPrice) || 0,` (line ~2083), add:

```js
    weeklyAutoDiscount: Number(weeklyAutoDiscount) || 0,
    monthlyAutoDiscount: Number(monthlyAutoDiscount) || 0,
```

## 3. `frontend/lib/api.ts` — Add to type signatures

In `createProduct` payload (after `monthlyOfferPrice` around line ~966):

```ts
    weeklyAutoDiscount?: number;
    monthlyAutoDiscount?: number;
```

Same in `updateProduct` payload (after `monthlyOfferPrice` around line ~1041).

## 4. `frontend/app/admin/products/bulk/page.tsx` — Full rewrite

Replace the entire file with:

```tsx
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
  mainCategory?: string;
  mainCategoryDe?: string;
  category?: string;
  categoryDe?: string;
};

type CategoryResolutionResult = {
  categoryId: string;
  createdMain: boolean;
  createdChild: boolean;
};

type SheetRow = Record<string, string | number | boolean | null | undefined>;

const REQUIRED_COLUMNS = ["Product Name (EN)", "Slug", "Monthly Rental Price (base)", "Brand"];
const OPTIONAL_RELATION_COLUMNS = ["Brand", "Category", "Main Category"];

const TEMPLATE_HEADERS = [
  "Product Name (EN)",
  "Product Name (DE)",
  "Slug",
  "SKU",
  "Brand",
  "Short Description (EN)",
  "Short Description (DE)",
  "Long Description (EN)",
  "Long Description (DE)",
  "Category",
  "Main Category",
  "Upload Main Image",
  "Other Images",
  "Weekly Buyer Price",
  "Weekly Offer Price",
  "Weekly Auto Discount (%)",
  "Monthly Buyer Price",
  "Monthly Offer Price",
  "Monthly Auto Discount (%)",
  "Monthly Rental Price (base)",
  "Delivery Fee (EUR)",
  "Stock",
  "Low Stock Warning",
  "Stock Status",
  "Min Rental (weeks)",
  "Max Rental (weeks)",
  "Min Rental (months)",
  "Max Rental (months)",
  "Max Rental Qty",
  "Unit",
  "Verification Required",
  "Enable Deposit",
  "Deposit Amount",
  "Replacement Value",
  "Weight (kg)",
  "Tags",
  "Specifications",
  "Meta Title",
  "Canonical URL",
  "Meta Description",
  "Meta Keywords",
  "OG Title",
  "OG Image URL",
  "OG Description",
  "Add to Most Popular",
  "Refundable",
  "Active",
];

const TEMPLATE_SAMPLE = [
  "Gaming Laptop Rental",
  "Gaming Laptop Vermietung",
  "gaming-laptop-rental",
  "LAP-RTX-001",
  "Lenovo",
  "RTX laptop with flexible rental plans.",
  "RTX Laptop mit flexiblen Mietplaenen.",
  "<p>Powerful laptop for gaming and creative work.</p>",
  "<p>Leistungsstarkes Laptop fuer Gaming und Kreativarbeit.</p>",
  "Gaming Laptops",
  "Computers",
  "laptop-main",
  "laptop-gallery-1,laptop-gallery-2",
  "49.99",
  "29.99",
  "0",
  "149.99",
  "119.99",
  "0",
  "29.99",
  "0",
  "10",
  "3",
  "in_stock",
  "1",
  "2",
  "1",
  "24",
  "1",
  "piece",
  "Yes",
  "No",
  "0",
  "0",
  "0",
  "gaming,laptop,student",
  "CPU:Intel Core i7|RAM:16GB|Storage:512GB SSD",
  "Gaming Laptop Rental | MietlyPlus",
  "https://mietlyplus.de/products/gaming-laptop-rental",
  "Rent a high-performance gaming laptop with flexible weekly or monthly plans.",
  "gaming, laptop, rent",
  "Gaming Laptop Rental",
  "https://mietlyplus.de/images/og-gaming-laptop.jpg",
  "Rent a gaming laptop from MietlyPlus",
  "Yes",
  "Yes",
  "Yes",
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

const COLUMN_MAP: Record<string, string> = {
  "Product Name (EN)": "productNameEn",
  "Product Name (DE)": "productNameDe",
  "Slug": "slug",
  "SKU": "sku",
  "Brand": "brand",
  "Short Description (EN)": "shortDescEn",
  "Short Description (DE)": "shortDescDe",
  "Long Description (EN)": "longDescEn",
  "Long Description (DE)": "longDescDe",
  "Category": "category",
  "Main Category": "mainCategory",
  "Upload Main Image": "imageKey",
  "Other Images": "galleryImageKeys",
  "Weekly Buyer Price": "buyerPrice",
  "Weekly Offer Price": "offerPrice",
  "Weekly Auto Discount (%)": "weeklyAutoDiscount",
  "Monthly Buyer Price": "monthlyBuyerPrice",
  "Monthly Offer Price": "monthlyOfferPrice",
  "Monthly Auto Discount (%)": "monthlyAutoDiscount",
  "Monthly Rental Price (base)": "monthlyPrice",
  "Delivery Fee (EUR)": "deliveryFee",
  "Stock": "stock",
  "Low Stock Warning": "lowStockWarning",
  "Stock Status": "stockStatus",
  "Min Rental (weeks)": "minRentalWeeks",
  "Max Rental (weeks)": "maxRentalWeeks",
  "Min Rental (months)": "minRentalMonths",
  "Max Rental (months)": "maxRentalMonths",
  "Max Rental Qty": "maxRentalQuantity",
  "Unit": "unit",
  "Verification Required": "verificationRequired",
  "Enable Deposit": "depositEnabled",
  "Deposit Amount": "securityDeposit",
  "Replacement Value": "replacementValue",
  "Weight (kg)": "weightKg",
  "Tags": "tags",
  "Specifications": "specifications",
  "Meta Title": "metaTitle",
  "Canonical URL": "canonicalUrl",
  "Meta Description": "metaDescription",
  "Meta Keywords": "metaKeywords",
  "OG Title": "ogTitle",
  "OG Image URL": "ogImageUrl",
  "OG Description": "ogDescription",
  "Add to Most Popular": "isMostPopular",
  "Refundable": "refundable",
  "Active": "isActive",
};

function normalizeRow(row: SheetRow): Record<string, unknown> {
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
  const imageKey = toStringValue(raw.imageKey || raw["Upload Main Image"]).toLowerCase();
  const galleryKeys = parseCommaList(raw.galleryImageKeys || raw["Other Images"]).map((item) => item.toLowerCase());

  const get = (friendlyName: string): unknown => {
    const internalKey = COLUMN_MAP[friendlyName];
    return raw[internalKey] !== undefined ? raw[internalKey] : raw[friendlyName];
  };

  const verificationRequired = parseBoolean(get("Verification Required"), true);
  const depositEnabled = parseBoolean(get("Enable Deposit"), false) || false;

  return {
    title: toStringValue(get("Product Name (EN)")),
    titleI18n: {
      en: toStringValue(get("Product Name (EN)")),
      de: toStringValue(get("Product Name (DE)")),
    },
    slug: toStringValue(get("Slug")),
    description: toStringValue(get("Long Description (EN)")),
    descriptionI18n: {
      en: toStringValue(get("Long Description (EN)")),
      de: toStringValue(get("Long Description (DE)")),
    },
    shortDescription: toStringValue(get("Short Description (EN)")),
    shortDescriptionI18n: {
      en: toStringValue(get("Short Description (EN)")),
      de: toStringValue(get("Short Description (DE)")),
    },
    imageUrl: uploadedImages.get(imageKey) || "",
    galleryImages: galleryKeys.map((key) => uploadedImages.get(key) || "").filter(Boolean),
    sku: toStringValue(get("SKU")),
    brand: toStringValue(get("Brand")),
    brandId: toStringValue(raw.brandId || ""),
    mainCategory: toStringValue(get("Main Category")),
    mainCategoryDe: toStringValue(raw.mainCategoryDe || ""),
    category: toStringValue(get("Category")),
    categoryDe: toStringValue(raw.categoryDe || ""),
    categoryId: toStringValue(raw.categoryId || ""),
    subcategoryId: toStringValue(raw.subcategoryId || ""),
    tags: parseCommaList(get("Tags")),
    monthlyPrice: Number(toStringValue(get("Monthly Rental Price (base)"))),
    buyerPrice: parseNumber(get("Weekly Buyer Price"), 0),
    offerPrice: parseNumber(get("Weekly Offer Price"), 0),
    monthlyBuyerPrice: parseNumber(get("Monthly Buyer Price"), 0),
    monthlyOfferPrice: parseNumber(get("Monthly Offer Price"), 0),
    weeklyAutoDiscount: parseNumber(get("Weekly Auto Discount (%)"), 0),
    monthlyAutoDiscount: parseNumber(get("Monthly Auto Discount (%)"), 0),
    depositEnabled,
    securityDeposit: depositEnabled ? parseNumber(get("Deposit Amount"), 0) : 0,
    replacementValue: parseNumber(get("Replacement Value"), 0),
    minimumRentalWeeks: parseNumber(get("Min Rental (weeks)"), 1),
    maximumRentalWeeks: parseNumber(get("Max Rental (weeks)"), 2),
    minimumRentalMonths: parseNumber(get("Min Rental (months)"), 1),
    maximumRentalMonths: parseNumber(get("Max Rental (months)"), 24),
    minimumRentalDays: (parseNumber(get("Min Rental (weeks)"), 1) || 1) * 7,
    maximumRentalDays: (parseNumber(get("Max Rental (weeks)"), 2) || 2) * 7,
    rentalPeriodUnit: "week",
    stock: parseNumber(get("Stock"), 0),
    stockStatus: (toStringValue(get("Stock Status")) || "in_stock") as BulkProductInput["stockStatus"],
    lowStockWarning: parseNumber(get("Low Stock Warning"), 5),
    maxRentalQuantity: parseNumber(get("Max Rental Qty"), 1),
    unit: toStringValue(get("Unit")) || "piece",
    weightKg: parseNumber(get("Weight (kg)"), 0),
    deliveryFee: parseNumber(get("Delivery Fee (EUR)"), 0),
    verificationRequired,
    refundable: parseBoolean(get("Refundable"), true),
    specifications: parseSpecifications(get("Specifications")),
    seo: {
      metaTitle: toStringValue(get("Meta Title")),
      metaDescription: toStringValue(get("Meta Description")),
      metaKeywords: parseCommaList(get("Meta Keywords")),
      canonicalUrl: toStringValue(get("Canonical URL")),
      ogTitle: toStringValue(get("OG Title")),
      ogDescription: toStringValue(get("OG Description")),
      ogImageUrl: toStringValue(get("OG Image URL")),
    },
    isMostPopular: parseBoolean(get("Add to Most Popular"), false),
    isActive: parseBoolean(get("Active"), true),
  };
}

function validateProduct(product: BulkProductInput, rowNumber: number): string | null {
  if (!product.title) return `Row ${rowNumber}: Product Name (EN) is required.`;
  if (!product.slug) return `Row ${rowNumber}: Slug is required.`;
  if (!product.brandId && !product.brand) return `Row ${rowNumber}: Brand is required.`;
  if (!product.categoryId && !product.category && !product.mainCategory) {
    return `Row ${rowNumber}: Category or Main Category is required.`;
  }
  if (!Number.isFinite(product.monthlyPrice)) return `Row ${rowNumber}: Monthly Rental Price (base) must be a valid number.`;
  if ((product.minimumRentalDays || 1) > (product.maximumRentalDays || 1)) {
    return `Row ${rowNumber}: Min rental weeks cannot be greater than Max rental weeks.`;
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
    throw new Error(`Row ${rowNumber}: Brand is required.`);
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
    return { categoryId: directSubcategoryId, createdMain: false, createdChild: false };
  }

  const directCategoryId = toStringValue(product.categoryId);
  const mainCategoryLookup = toLookup(product.mainCategory);
  const categoryLookup = toLookup(product.category);

  let mainCategory: Category | null = null;
  let createdMain = false;

  if (directCategoryId) {
    const fromId = findCategoryById(categoryCache.items, directCategoryId);
    if (fromId && !fromId.parentId) {
      mainCategory = fromId;
    }
    if (fromId && fromId.parentId && !categoryLookup) {
      return { categoryId: fromId.id, createdMain: false, createdChild: false };
    }
    if (!fromId && !mainCategoryLookup && !categoryLookup) {
      return { categoryId: directCategoryId, createdMain: false, createdChild: false };
    }
  }

  if (!mainCategory) {
    if (!mainCategoryLookup) {
      throw new Error(`Row ${rowNumber}: Main Category is required.`);
    }

    const existingMain = findRootCategoryByLookup(categoryCache.items, mainCategoryLookup);
    if (existingMain) {
      mainCategory = existingMain;
    } else {
      const existingSlugs = new Set(flattenCategoryTree(categoryCache.items).map((item) => toLookup(item.slug)));
      const slug = uniqueSlugFromExisting(toStringValue(product.mainCategory), existingSlugs);
      const parentPayload = {
        name: {
          en: toStringValue(product.mainCategory),
          de: toStringValue(product.mainCategoryDe) || toStringValue(product.mainCategory),
        },
        slug,
        image: null,
        parentId: null,
      };
      try {
        const createdParent = (await createCategory(parentPayload, adminToken)) as Category;
        categoryCache.items = addCategoryToTree(categoryCache.items, createdParent);
        mainCategory = createdParent;
        createdMain = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create category.";
        if (message.toLowerCase().includes("already exists")) {
          const refreshed = await fetchAdminCategoryTree(adminToken);
          categoryCache.items = refreshed;
          const recovered = findRootCategoryByLookup(refreshed, mainCategoryLookup);
          if (recovered) {
            mainCategory = recovered;
          } else {
            throw new Error(`Row ${rowNumber}: ${message}`);
          }
        } else {
          throw new Error(`Row ${rowNumber}: ${message}`);
        }
      }
    }
  }

  if (!mainCategory) {
    throw new Error(`Row ${rowNumber}: Could not resolve Main Category.`);
  }

  if (!categoryLookup) {
    return {
      categoryId: mainCategory.id,
      createdMain,
      createdChild: false,
    };
  }

  const existingChild = findSubcategoryByLookup(mainCategory, categoryLookup);
  if (existingChild) {
    return {
      categoryId: existingChild.id,
      createdMain,
      createdChild: false,
    };
  }

  const existingSlugs = new Set(flattenCategoryTree(categoryCache.items).map((item) => toLookup(item.slug)));
  const childSlug = uniqueSlugFromExisting(toStringValue(product.category), existingSlugs);
  const childPayload = {
    name: {
      en: toStringValue(product.category),
      de: toStringValue(product.categoryDe) || toStringValue(product.category),
    },
    slug: childSlug,
    image: null,
    parentId: mainCategory.id,
  };

  try {
    const createdChild = (await createCategory(childPayload, adminToken)) as Category;
    categoryCache.items = addCategoryToTree(categoryCache.items, createdChild);
    return {
      categoryId: createdChild.id,
      createdMain,
      createdChild: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create subcategory.";
    if (message.toLowerCase().includes("already exists")) {
      const refreshed = await fetchAdminCategoryTree(adminToken);
      categoryCache.items = refreshed;
      const recoveredMain =
        findCategoryById(refreshed, mainCategory.id) ||
        findRootCategoryByLookup(refreshed, mainCategoryLookup);
      const recoveredChild = recoveredMain ? findSubcategoryByLookup(recoveredMain, categoryLookup) : null;
      if (recoveredChild) {
        return {
          categoryId: recoveredChild.id,
          createdMain,
          createdChild: false,
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
  delete payload.mainCategory;
  delete payload.mainCategoryDe;
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
      setMessage(`${rows.length} rows parsed. You can import now and add images later from Edit Product.`);
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
      let createdMainCategories = 0;
      let createdChildCategories = 0;

      for (const row of rowsWithMeta) {
        const brandResult = await ensureBrandId(row.product, row.rowNumber, adminToken, brandCache);
        if (brandResult.created) createdBrands += 1;

        const categoryResult = await ensureCategoryId(
          row.product,
          row.rowNumber,
          adminToken,
          categoryCache
        );
        if (categoryResult.createdMain) createdMainCategories += 1;
        if (categoryResult.createdChild) createdChildCategories += 1;

        const payload = buildCreatePayload(
          row.product,
          brandResult.brandId,
          categoryResult.categoryId
        );
        await createProduct(adminToken, payload);
        successCount += 1;
      }

      setMessage(
        `${successCount} products imported successfully. Created ${createdBrands} brand(s), ${createdMainCategories} main categor(ies), ${createdChildCategories} subcategor(ies).`
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
    XLSX.writeFile(workbook, "mietlyplus-products-template.xlsx");
  };

  const downloadSampleCsv = () => {
    const rows = [TEMPLATE_HEADERS, TEMPLATE_SAMPLE];
    const csvContent = rows.map((row) => row.map((cell) => toCsvCell(cell)).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mietlyplus-products-sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-bold text-zinc-900">Add Bulk Products</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upload an Excel or CSV file with your product data. Download the sample template to see the required format.
      </p>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Column Guide</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li><strong>Required:</strong> Product Name (EN), Slug, Monthly Rental Price (base), Brand</li>
          <li>Main Category = parent (e.g. Computers), Category = child (e.g. Gaming Laptops)</li>
          <li>Use brand names to auto-create missing brands</li>
          <li>Images: Upload files below, then reference by filename (without extension) in "Upload Main Image" and "Other Images" columns</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Download Sample Excel
          </button>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Download Sample CSV
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
          <p className="mt-1 text-xs text-zinc-500">Skip if you want to add images later from Edit Product.</p>
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
```
