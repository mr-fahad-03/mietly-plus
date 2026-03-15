"use client";

import Link from "next/link";
import { Product } from "@/lib/types";

type RentalProductCardProps = {
  product: Product;
  className?: string;
  cardAttr?: Record<string, string>;
  wishlistActive?: boolean;
  onToggleWishlist?: (productId: string) => void;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function RentalProductCard({
  product,
  className = "",
  cardAttr = {},
  wishlistActive = false,
  onToggleWishlist,
}: RentalProductCardProps) {
  const buyerPrice = product.buyerPrice || 0;
  const offerPrice = product.offerPrice || 0;
  const hasOffer = buyerPrice > 0 && offerPrice > 0 && offerPrice < buyerPrice;
  const discountPercent = hasOffer ? Math.round(((buyerPrice - offerPrice) / buyerPrice) * 100) : 0;
  const shortDescription = stripHtml(product.shortDescriptionI18n?.en || product.shortDescription || "");
  const effectivePrice = hasOffer ? offerPrice : buyerPrice > 0 ? buyerPrice : product.monthlyPrice;
  const categoryName = product.category?.name?.en || "General";
  const offerBadge = discountPercent > 0 ? `${discountPercent}% Off` : "Special Offer";

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_10px_20px_-20px_rgba(24,24,27,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(24,24,27,0.45)] md:rounded-2xl ${className}`}
      {...cardAttr}
    >
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5 md:left-3 md:top-3 md:gap-2">
        <span className="rounded-full border border-[rgba(73,153,173,0.35)] bg-[rgba(73,153,173,0.14)] px-2 py-0.5 text-[10px] font-semibold text-[rgb(47,118,135)] md:px-2.5 md:py-1 md:text-xs">
          Available
        </span>
        <span className="rounded-full border border-[rgba(73,153,173,0.35)] bg-[rgba(73,153,173,0.14)] px-2 py-0.5 text-[10px] font-semibold text-[rgb(47,118,135)] md:px-2.5 md:py-1 md:text-xs">
          {offerBadge}
        </span>
      </div>

      <button
        type="button"
        aria-label="wishlist"
        onClick={() => onToggleWishlist?.(product.id)}
        className="absolute right-2 top-2 z-10 rounded-full border border-zinc-300 bg-white/95 p-1 text-zinc-500 transition hover:border-[rgba(73,153,173,0.35)] hover:text-[rgb(73,153,173)] md:right-3 md:top-3 md:p-1.5"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 md:h-4 md:w-4 ${wishlistActive ? "text-rose-500" : ""}`}
          fill={wishlistActive ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20s-7-4.8-9-9a5.5 5.5 0 019.1-5.4L12 6l-.1-.4A5.5 5.5 0 0121 11c-2 4.2-9 9-9 9z" />
        </svg>
      </button>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="px-2.5 pb-2.5 pt-9 md:px-4 md:pb-4 md:pt-12">
          <div className="mx-auto flex h-28 w-full items-center justify-center rounded-lg bg-zinc-50 p-2 md:h-44 md:rounded-xl md:p-3">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.04]"
            />
          </div>

          <div className="mt-2.5 space-y-1.5 md:mt-4 md:space-y-2">
            <h3 className="line-clamp-2 text-base font-extrabold leading-5 text-zinc-900 group-hover:text-[rgb(73,153,173)] md:text-lg md:leading-6">
              {product.title}
            </h3>

            <p className="line-clamp-2 min-h-[2.25rem] text-[12px] leading-4 text-zinc-600 md:min-h-[2.5rem] md:text-[13px] md:leading-5">
              {shortDescription || "Flexible monthly rental with trusted quality checks."}
            </p>

            <p className="line-clamp-1 text-[12px] text-zinc-700 md:text-[13px]">
              Category: <span className="font-semibold text-[rgb(73,153,173)]">{categoryName}</span>
            </p>

            <div className="space-y-0.5 md:space-y-1">
              <p className="text-lg font-extrabold leading-none text-[rgb(60,138,158)] md:text-xl">
                Rent EUR {formatAmount(effectivePrice)} / month
              </p>
              {hasOffer ? (
                <p className="text-xs text-zinc-400 line-through md:text-sm">EUR {formatAmount(buyerPrice)}</p>
              ) : (
                <p className="text-xs text-zinc-400 line-through md:text-sm">EUR {formatAmount(effectivePrice + 50)}</p>
              )}
              <p className="text-[11px] font-medium text-zinc-500 md:text-xs">*Inclusive VAT</p>
            </div>
          </div>

          <span className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgb(73,153,173)] bg-[rgb(73,153,173)] px-2 py-2 text-xs font-bold text-white transition hover:bg-[rgb(60,138,158)] md:mt-4 md:gap-2 md:rounded-xl md:px-4 md:py-3 md:text-[13px]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            Rent it Now
          </span>
        </div>
      </Link>
    </article>
  );
}

