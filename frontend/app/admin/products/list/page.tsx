"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteProduct, fetchAdminProducts } from "@/lib/api";
import { Product } from "@/lib/types";

export default function AdminProductsListPage() {
  const [adminToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("admin_token") || "";
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = async (token: string) => {
    const data = await fetchAdminProducts(token);
    setProducts(data);
  };

  useEffect(() => {
    if (!adminToken) return;
    fetchAdminProducts(adminToken)
      .then((data) => setProducts(data))
      .catch(() => setError("Could not fetch products."));
  }, [adminToken]);

  const onDelete = async (productId: string) => {
    if (!adminToken) return;
    if (!window.confirm("Delete this product?")) return;
    setMessage("");
    setError("");
    try {
      await deleteProduct(adminToken, productId);
      setMessage("Product deleted.");
      await loadProducts(adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Product List</h1>
        <div className="flex gap-2">
          <Link href="/admin/products" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">
            Add Product
          </Link>
          <Link href="/admin/products/bulk" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">
            Add Bulk
          </Link>
        </div>
      </div>

      {message ? <p className="text-sm text-lime-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {products.length === 0 ? <p className="text-sm text-zinc-500">No products yet.</p> : null}
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 p-3">
              <img src={product.imageUrl} alt={product.title} className="h-14 w-24 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-zinc-900">{product.title}</p>
                  {product.isMostPopular ? (
                    <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-zinc-500">{product.category?.name.en || "Uncategorized"}</p>
                <p className="text-xs text-zinc-500">
                  EUR {product.monthlyPrice}/month | {product.minimumRentalWeeks}-{product.maximumRentalWeeks} weeks | {product.minimumRentalMonths}-{product.maximumRentalMonths} months | stock {product.stock} ({product.stockStatus.replace("_", " ")})
                </p>
                <p className="text-xs text-zinc-500">
                  Deposit EUR {product.securityDeposit} | {product.refundable ? "refundable" : "non-refundable"} | {product.isActive ? "active" : "inactive"}
                </p>
                <p className="text-xs text-zinc-500">
                  Verification: {product.verificationRequired ? "required" : "not required"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => (window.location.href = `/admin/products/edit/${product.id}`)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product.id)}
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
