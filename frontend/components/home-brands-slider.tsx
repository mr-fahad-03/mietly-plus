"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPublicBrands } from "@/lib/api";
import { Brand } from "@/lib/types";

export function HomeBrandsSlider() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const showControls = useMemo(() => brands.length > 6, [brands.length]);

  useEffect(() => {
    fetchPublicBrands()
      .then((data) => setBrands(data.filter((brand) => brand.isActive)))
      .catch(() => setBrands([]));
  }, []);

  useEffect(() => {
    if (!showControls) return;
    const interval = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail) return;
      const card = rail.querySelector<HTMLElement>("[data-brand-card]");
      const amount = card ? card.offsetWidth + 12 : 180;
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      const next = rail.scrollLeft + amount;
      rail.scrollTo({
        left: next >= maxScroll - 2 ? 0 : next,
        behavior: "smooth",
      });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [showControls]);

  const scrollBy = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-brand-card]");
    const amount = card ? card.offsetWidth + 12 : 180;
    rail.scrollBy({ left: direction === "left" ? -amount * 2 : amount * 2, behavior: "smooth" });
  };

  if (brands.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-12">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-zinc-900">Brands</h2>
        {showControls ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => scrollBy("left")} className="h-12 w-12 rounded-full border border-[rgba(73,153,173,0.35)] text-2xl text-[rgb(73,153,173)] transition hover:border-[rgb(73,153,173)] hover:text-[rgb(60,138,158)]">&lt;</button>
            <button type="button" onClick={() => scrollBy("right")} className="h-12 w-12 rounded-full border border-[rgba(73,153,173,0.35)] text-2xl text-[rgb(73,153,173)] transition hover:border-[rgb(73,153,173)] hover:text-[rgb(60,138,158)]">&gt;</button>
          </div>
        ) : null}
      </div>

      <div ref={railRef} className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((brand) => (
          <div
            key={brand.id}
            data-brand-card
            className="min-w-[170px] rounded-xl border border-[rgba(73,153,173,0.22)] bg-white p-4 text-center"
          >
            <div className="mb-3 flex h-16 items-center justify-center">
              <img src={brand.image || "https://via.placeholder.com/120x50?text=Brand"} alt={brand.name} className="max-h-14 w-auto object-contain" />
            </div>
            <p className="text-xl font-medium text-zinc-800">{brand.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


