export function HomeBenefitsStrip() {
  const items = [
    {
      label: "500,000+ happy customers",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="9" cy="10" r="1" />
          <circle cx="15" cy="10" r="1" />
          <path d="M8 15c1 1.2 2.3 2 4 2s3-.8 4-2" />
        </svg>
      ),
    },
    {
      label: "Low monthly costs",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="17" cy="12" r="2" />
        </svg>
      ),
    },
    {
      label: "Rent from 1 to 24+ months",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      label: "Mietly Care available",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12a8 8 0 0116 0M7 12v6M17 12v6M7 18h10" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-y border-[rgba(73,153,173,0.22)] bg-gradient-to-b from-white to-[rgba(73,153,173,0.04)]">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-2 px-3 py-3 md:grid-cols-2 md:gap-4 md:px-4 md:py-5 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2.5 shadow-[0_8px_24px_-20px_rgba(0,0,0,0.45)] md:rounded-2xl md:px-4 md:py-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(73,153,173,0.35)] bg-[rgba(73,153,173,0.10)] text-[rgb(73,153,173)] md:h-9 md:w-9">
                {item.icon}
              </span>
              <p className="text-sm leading-tight font-semibold text-zinc-900 md:text-lg">{item.label}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

