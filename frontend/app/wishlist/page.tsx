"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { RentalProductCard } from "@/components/rental-product-card";
import { useWishlist } from "@/lib/use-wishlist";

export default function WishlistPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const token = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key === "user_token") onStoreChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    () => (typeof window !== "undefined" ? localStorage.getItem("user_token") || "" : ""),
    () => ""
  );
  const { products, isWishlisted, toggleWishlist, loading } = useWishlist();

  useEffect(() => {
    if (!token) {
      router.replace("/signin");
    }
  }, [router, token]);

  const onToggleWishlist = async (productId: string) => {
    setMessage("");
    try {
      await toggleWishlist(productId);
    } catch (err) {
      if (err instanceof Error && err.message === "LOGIN_REQUIRED") {
        router.push("/signin");
      } else {
        setMessage("Could not update wishlist.");
      }
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <ClientNavbar />
        <main className="mx-auto w-full max-w-[1280px] px-4 py-10">
          <p className="text-zinc-600">Checking account...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <ClientNavbar />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">My Wishlist</h1>
            <p className="mt-1 text-zinc-600">Saved products linked to your account.</p>
          </div>
          <span className="rounded-full border border-lime-200 bg-lime-50 px-4 py-1 text-sm font-semibold text-lime-700">
            {products.length} items
          </span>
        </div>

        {message ? <p className="mb-4 text-sm text-rose-600">{message}</p> : null}

        {loading ? <p className="text-sm text-zinc-500">Loading wishlist...</p> : null}

        {!loading && products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
            <p className="text-zinc-700">Your wishlist is empty.</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex rounded-lg bg-lime-500 px-4 py-2 text-sm font-bold text-white"
            >
              Browse products
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <RentalProductCard
              key={product.id}
              product={product}
              wishlistActive={isWishlisted(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
