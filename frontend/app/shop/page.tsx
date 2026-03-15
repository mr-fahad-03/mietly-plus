"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { RentalProductCard } from "@/components/rental-product-card";
import { fetchCategoryTree, fetchPublicProducts } from "@/lib/api";
import { useWishlist } from "@/lib/use-wishlist";
import { Category, Product } from "@/lib/types";

type StockFilter = "all" | "in_stock" | "out_of_stock";

function getEffectivePrice(product: Product) {
  if (product.offerPrice > 0 && product.offerPrice < product.buyerPrice) return product.offerPrice;
  if (product.buyerPrice > 0) return product.buyerPrice;
  return product.monthlyPrice;
}

function collectDescendantSlugs(category: Category): string[] {
  const slugs = [category.slug];
  for (const child of category.children || []) slugs.push(...collectDescendantSlugs(child));
  return slugs;
}

export default function ShopPage() {
  const router = useRouter();
  const PRODUCTS_PER_BATCH = 9;
  const searchParams = useSearchParams();
  const categoryFromQuery = (searchParams.get("category") || "").trim();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const [pendingMin, setPendingMin] = useState("0");
  const [pendingMax, setPendingMax] = useState("0");
  const [appliedMin, setAppliedMin] = useState(0);
  const [appliedMax, setAppliedMax] = useState(0);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchPublicProducts()
      .then((data) => setProducts(data))
      .catch(() => setError("Could not load products."));

    fetchCategoryTree().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const allPrices = products.map(getEffectivePrice);
    const min = Math.floor(Math.min(...allPrices));
    const max = Math.ceil(Math.max(...allPrices));
    setAppliedMin(min);
    setAppliedMax(max);
    setPendingMin(String(min));
    setPendingMax(String(max));
  }, [products]);

  useEffect(() => {
    setSelectedCategorySlug(categoryFromQuery);
  }, [categoryFromQuery]);

  const topCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const allBrands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort(),
    [products]
  );

  const categorySlugSet = useMemo(() => {
    if (!selectedCategorySlug) return null;
    const findBySlug = (nodes: Category[]): Category | null => {
      for (const node of nodes) {
        if (node.slug === selectedCategorySlug) return node;
        const nested = findBySlug(node.children || []);
        if (nested) return nested;
      }
      return null;
    };
    const found = findBySlug(categories);
    if (!found) return new Set<string>([selectedCategorySlug]);
    return new Set<string>(collectDescendantSlugs(found));
  }, [categories, selectedCategorySlug]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    const findBySlug = (nodes: Category[]): Category | null => {
      for (const node of nodes) {
        if (node.slug === selectedCategorySlug) return node;
        const nested = findBySlug(node.children || []);
        if (nested) return nested;
      }
      return null;
    };
    return findBySlug(categories);
  }, [categories, selectedCategorySlug]);

  const selectedCategorySeoHtml = useMemo(() => {
    if (!selectedCategory?.seo) return "";
    return selectedCategory.seo.contentHtml?.en || selectedCategory.seo.contentHtml?.de || "";
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const price = getEffectivePrice(product);
      if (price < appliedMin || price > appliedMax) return false;

      if (categorySlugSet && !categorySlugSet.has(product.category?.slug || "")) return false;

      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;

      if (stockFilter === "in_stock" && product.stock <= 0) return false;
      if (stockFilter === "out_of_stock" && product.stock > 0) return false;

      return true;
    });
  }, [products, appliedMin, appliedMax, categorySlugSet, selectedBrands, stockFilter]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_BATCH);
  }, [appliedMin, appliedMax, selectedCategorySlug, selectedBrands, stockFilter, categoryFromQuery]);

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    chips.push(`Price: EUR ${appliedMin} - EUR ${appliedMax}`);
    if (selectedCategorySlug) chips.push(`Category: ${selectedCategorySlug}`);
    if (selectedBrands.length) chips.push(`Brands: ${selectedBrands.join(", ")}`);
    if (stockFilter !== "all") chips.push(stockFilter === "in_stock" ? "In Stock" : "Out of Stock");
    return chips;
  }, [appliedMin, appliedMax, selectedCategorySlug, selectedBrands, stockFilter]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]));
  };

  const clearAllFilters = () => {
    const allPrices = products.map(getEffectivePrice);
    const min = allPrices.length ? Math.floor(Math.min(...allPrices)) : 0;
    const max = allPrices.length ? Math.ceil(Math.max(...allPrices)) : 0;
    setPendingMin(String(min));
    setPendingMax(String(max));
    setAppliedMin(min);
    setAppliedMax(max);
    setSelectedCategorySlug("");
    setSelectedBrands([]);
    setStockFilter("all");
  };

  const applyPrice = () => {
    setAppliedMin(Number(pendingMin || "0"));
    setAppliedMax(Number(pendingMax || "0"));
  };

  const onToggleWishlist = async (productId: string) => {
    try {
      await toggleWishlist(productId);
    } catch (err) {
      if (err instanceof Error && err.message === "LOGIN_REQUIRED") {
        router.push("/signin");
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <ClientNavbar />
      <main className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-10 lg:grid-cols-[300px_1fr]">
        <aside className="hidden h-fit space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:block lg:self-start">
          <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-800">Active Filters</p>
              <button type="button" onClick={clearAllFilters} className="text-xs font-semibold text-rose-600">
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {activeFilters.map((filter) => (
                <div key={filter} className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-sm text-zinc-700">
                  <span className="truncate">{filter}</span>
                </div>
              ))}
            </div>
          </div>

          <section className="border-b border-zinc-200 pb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-lime-700">Price Range</h3>
              <span className="text-zinc-400">-</span>
            </div>
            <input
              type="range"
              min={pendingMin}
              max={pendingMax}
              value={pendingMax}
              onChange={(e) => setPendingMax(e.target.value)}
              className="w-full accent-lime-500"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-zinc-600">
                MIN
                <input value={pendingMin} onChange={(e) => setPendingMin(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs font-semibold text-zinc-600">
                MAX
                <input value={pendingMax} onChange={(e) => setPendingMax(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
              </label>
            </div>
            <button type="button" onClick={applyPrice} className="mt-3 w-full rounded-md border border-lime-500 py-2 font-semibold text-lime-700">
              Apply
            </button>
          </section>

          <section className="border-b border-zinc-200 pb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">Categories</h3>
              <span className="text-zinc-400">-</span>
            </div>
            <label className="mb-2 flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                checked={selectedCategorySlug === ""}
                onChange={() => setSelectedCategorySlug("")}
                className="accent-lime-500"
              />
              All Categories
            </label>
            <div className="space-y-1">
              {topCategories.map((category) => {
                const expanded = expandedCategoryIds.includes(category.id);
                return (
                  <div key={category.id}>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm text-zinc-700">
                        <input
                          type="radio"
                          checked={selectedCategorySlug === category.slug}
                          onChange={() => setSelectedCategorySlug(category.slug)}
                          className="accent-lime-500"
                        />
                        {category.name.en}
                      </label>
                      {category.children?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategoryIds((prev) =>
                              prev.includes(category.id)
                                ? prev.filter((id) => id !== category.id)
                                : [...prev, category.id]
                            )
                          }
                          className="px-2 text-zinc-500"
                        >
                          {expanded ? "-" : "+"}
                        </button>
                      ) : null}
                    </div>

                    {expanded && category.children?.length ? (
                      <div className="ml-6 mt-1 space-y-1">
                        {category.children.map((child) => (
                          <label key={child.id} className="flex items-center gap-2 text-sm text-zinc-600">
                            <input
                              type="radio"
                              checked={selectedCategorySlug === child.slug}
                              onChange={() => setSelectedCategorySlug(child.slug)}
                              className="accent-lime-500"
                            />
                            {child.name.en}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border-b border-zinc-200 pb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">Brands</h3>
              <span className="text-zinc-400">v</span>
            </div>
            <div className="max-h-36 space-y-1 overflow-auto pr-1">
              {allBrands.length === 0 ? <p className="text-sm text-zinc-500">No brands</p> : null}
              {allBrands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="accent-lime-500"
                  />
                  {brand}
                </label>
              ))}
            </div>
          </section>

          <section className="border-b border-zinc-200 pb-4">
            <h3 className="mb-2 font-semibold text-zinc-900">Stock Status</h3>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="radio" checked={stockFilter === "all"} onChange={() => setStockFilter("all")} className="accent-lime-500" />
                All Products
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="radio" checked={stockFilter === "in_stock"} onChange={() => setStockFilter("in_stock")} className="accent-lime-500" />
                In Stock
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="radio" checked={stockFilter === "out_of_stock"} onChange={() => setStockFilter("out_of_stock")} className="accent-lime-500" />
                Out of Stock
              </label>
            </div>
          </section>

          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full rounded-md bg-rose-600 py-2.5 font-semibold text-white"
          >
            Clear All Filters
          </button>
        </aside>

        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900 md:text-4xl">Shop Rentals</h1>
              <p className="mt-2 text-zinc-600">All available products on rent.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 lg:hidden"
              >
                Filters
              </button>
              <span className="rounded-full border border-lime-200 bg-lime-50 px-4 py-1 text-sm font-semibold text-lime-700">
                {filteredProducts.length} products
              </span>
            </div>
          </div>

          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <RentalProductCard
                key={product.id}
                product={product}
                wishlistActive={isWishlisted(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>

          {filteredProducts.length > visibleCount ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PRODUCTS_PER_BATCH)}
                className="rounded-lg border border-lime-500 bg-white px-6 py-2.5 text-sm font-bold text-lime-700 hover:bg-lime-50"
              >
                Load More
              </button>
            </div>
          ) : null}

          {selectedCategory && selectedCategorySeoHtml ? (
            <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 md:p-8">
              <h2 className="text-2xl font-extrabold text-zinc-900">
                {selectedCategory.seo?.metaTitle || selectedCategory.name.en}
              </h2>
              <div
                className="seo-content mt-4 space-y-4 text-[15px] leading-7 text-zinc-700"
                dangerouslySetInnerHTML={{ __html: selectedCategorySeoHtml }}
              />
            </section>
          ) : null}
        </section>
      </main>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <aside
            className="h-full w-[88vw] max-w-[360px] overflow-y-auto border-r border-zinc-200 bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-800">Active Filters</p>
                  <button type="button" onClick={clearAllFilters} className="text-xs font-semibold text-rose-600">
                    Clear All
                  </button>
                </div>
                <div className="space-y-2">
                  {activeFilters.map((filter) => (
                    <div key={filter} className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-sm text-zinc-700">
                      <span className="truncate">{filter}</span>
                    </div>
                  ))}
                </div>
              </div>

              <section className="border-b border-zinc-200 pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-lime-700">Price Range</h3>
                  <span className="text-zinc-400">-</span>
                </div>
                <input
                  type="range"
                  min={pendingMin}
                  max={pendingMax}
                  value={pendingMax}
                  onChange={(e) => setPendingMax(e.target.value)}
                  className="w-full accent-lime-500"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-zinc-600">
                    MIN
                    <input value={pendingMin} onChange={(e) => setPendingMin(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-zinc-600">
                    MAX
                    <input value={pendingMax} onChange={(e) => setPendingMax(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm" />
                  </label>
                </div>
                <button type="button" onClick={applyPrice} className="mt-3 w-full rounded-md border border-lime-500 py-2 font-semibold text-lime-700">
                  Apply
                </button>
              </section>

              <section className="border-b border-zinc-200 pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900">Categories</h3>
                  <span className="text-zinc-400">-</span>
                </div>
                <label className="mb-2 flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    checked={selectedCategorySlug === ""}
                    onChange={() => setSelectedCategorySlug("")}
                    className="accent-lime-500"
                  />
                  All Categories
                </label>
                <div className="space-y-1">
                  {topCategories.map((category) => {
                    const expanded = expandedCategoryIds.includes(category.id);
                    return (
                      <div key={category.id}>
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-sm text-zinc-700">
                            <input
                              type="radio"
                              checked={selectedCategorySlug === category.slug}
                              onChange={() => setSelectedCategorySlug(category.slug)}
                              className="accent-lime-500"
                            />
                            {category.name.en}
                          </label>
                          {category.children?.length ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCategoryIds((prev) =>
                                  prev.includes(category.id)
                                    ? prev.filter((id) => id !== category.id)
                                    : [...prev, category.id]
                                )
                              }
                              className="px-2 text-zinc-500"
                            >
                              {expanded ? "-" : "+"}
                            </button>
                          ) : null}
                        </div>

                        {expanded && category.children?.length ? (
                          <div className="ml-6 mt-1 space-y-1">
                            {category.children.map((child) => (
                              <label key={child.id} className="flex items-center gap-2 text-sm text-zinc-600">
                                <input
                                  type="radio"
                                  checked={selectedCategorySlug === child.slug}
                                  onChange={() => setSelectedCategorySlug(child.slug)}
                                  className="accent-lime-500"
                                />
                                {child.name.en}
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="border-b border-zinc-200 pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900">Brands</h3>
                  <span className="text-zinc-400">v</span>
                </div>
                <div className="max-h-36 space-y-1 overflow-auto pr-1">
                  {allBrands.length === 0 ? <p className="text-sm text-zinc-500">No brands</p> : null}
                  {allBrands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="accent-lime-500"
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </section>

              <section className="border-b border-zinc-200 pb-4">
                <h3 className="mb-2 font-semibold text-zinc-900">Stock Status</h3>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="radio" checked={stockFilter === "all"} onChange={() => setStockFilter("all")} className="accent-lime-500" />
                    All Products
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="radio" checked={stockFilter === "in_stock"} onChange={() => setStockFilter("in_stock")} className="accent-lime-500" />
                    In Stock
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="radio" checked={stockFilter === "out_of_stock"} onChange={() => setStockFilter("out_of_stock")} className="accent-lime-500" />
                    Out of Stock
                  </label>
                </div>
              </section>

              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full rounded-md bg-rose-600 py-2.5 font-semibold text-white"
              >
                Clear All Filters
              </button>
            </div>
          </aside>
        </div>
      ) : null}
      <HomeFooter />
    </div>
  );
}
