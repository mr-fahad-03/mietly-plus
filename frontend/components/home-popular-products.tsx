"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMostPopularProducts } from "@/lib/api";
import { Product } from "@/lib/types";
import { RentalProductCard } from "@/components/rental-product-card";
import { useWishlist } from "@/lib/use-wishlist";

export function HomePopularProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchMostPopularProducts()
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const showControls = useMemo(() => products.length > 4, [products.length]);

  const scrollByCards = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-popular-card]");
    const amount = card ? card.offsetWidth + 16 : 320;
    rail.scrollBy({
      left: direction === "left" ? -amount * 2 : amount * 2,
      behavior: "smooth",
    });
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

  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 md:text-3xl">Most Popular Products</h2>
          <p className="mt-1 text-sm text-zinc-500">Trending rentals this week</p>
        </div>
        {showControls ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCards("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:border-[rgb(73,153,173)] hover:text-[rgb(60,138,158)]"
              aria-label="Scroll left"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.5 4.5L7 10l5.5 5.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCards("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:border-[rgb(73,153,173)] hover:text-[rgb(60,138,158)]"
              aria-label="Scroll right"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7.5 4.5L13 10l-5.5 5.5" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.slice(0, 12).map((product) => (
          <RentalProductCard
            key={product.id}
            product={product}
            wishlistActive={isWishlisted(product.id)}
            onToggleWishlist={onToggleWishlist}
            className="min-w-[290px] max-w-[290px] snap-start sm:min-w-[320px] sm:max-w-[320px]"
            cardAttr={{ "data-popular-card": "1" }}
          />
        ))}
      </div>
    </section>
  );
}

