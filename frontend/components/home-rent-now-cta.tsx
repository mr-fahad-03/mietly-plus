import Link from "next/link";

export function HomeRentNowCta() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-14">
      <div className="overflow-hidden rounded-3xl border border-[rgba(73,153,173,0.22)] bg-gradient-to-r from-[rgba(73,153,173,0.10)] via-white to-[rgba(73,153,173,0.14)] p-8 md:p-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[rgb(73,153,173)]">Start Renting</p>
            <h3 className="mt-2 text-3xl font-extrabold text-zinc-900 md:text-4xl">
              Get Products on Rent Now
            </h3>
            <p className="mt-3 max-w-2xl text-lg text-zinc-600">
              Browse all available products and pick the perfect rental plan for your needs.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[rgb(73,153,173)] px-8 text-lg font-bold text-white shadow-sm transition hover:bg-[rgb(60,138,158)]"
          >
            Go To Shop
          </Link>
        </div>
      </div>
    </section>
  );
}

