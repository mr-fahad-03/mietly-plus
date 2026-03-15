"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPublicBanners } from "@/lib/api";
import { Banner } from "@/lib/types";

function resolveBannerImageSrc(rawSrc: string) {
  try {
    const parsed = new URL(rawSrc);
    if (parsed.hostname === "www.grover.com" && parsed.pathname === "/_next/image") {
      const nested = parsed.searchParams.get("url");
      if (nested) {
        return decodeURIComponent(nested);
      }
    }
    return rawSrc;
  } catch {
    return rawSrc;
  }
}

export function HomeBannerSection() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const device = isMobile ? "mobile" : "desktop";
    fetchPublicBanners({ device, position: "home" })
      .then((data) => {
        setBanners(data.filter((banner) => banner.device === device));
        setActiveIndex(0);
      })
      .catch(() => setBanners([]));
  }, [isMobile]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [banners.length]);

  const currentBanner = useMemo(() => banners[activeIndex], [activeIndex, banners]);

  if (!currentBanner) {
    return null;
  }

  const href = currentBanner.buttonLink || "#";
  const imageSrc = resolveBannerImageSrc(currentBanner.imageUrl);

  const goTo = (index: number) => {
    setActiveIndex(index);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % banners.length);
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <section className="w-full px-0 py-4 md:py-6">
      <a
        href={href}
        className="group relative block overflow-hidden bg-[rgba(73,153,173,0.10)] shadow-sm md:mx-auto md:max-w-[1280px] md:rounded-3xl"
      >
        <div className="relative aspect-[16/8] w-full bg-white md:aspect-[16/6]">
          <img
            src={imageSrc}
            alt={currentBanner.title || "Banner"}
            className="h-full w-full object-cover md:object-contain"
            loading="lazy"
          />
        </div>
      </a>

      {banners.length > 1 ? (
        <div className="mx-auto mt-3 flex w-full items-center justify-center gap-3 md:max-w-[1280px]">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full border border-[rgba(73,153,173,0.35)] px-3 py-1 text-sm text-[rgb(73,153,173)] hover:bg-[rgba(73,153,173,0.10)]"
            aria-label="Previous banner"
          >
            Prev
          </button>
          <div className="flex items-center gap-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "w-7 bg-[rgb(73,153,173)]" : "w-2.5 bg-[rgba(73,153,173,0.35)]"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full border border-[rgba(73,153,173,0.35)] px-3 py-1 text-sm text-[rgb(73,153,173)] hover:bg-[rgba(73,153,173,0.10)]"
            aria-label="Next banner"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

