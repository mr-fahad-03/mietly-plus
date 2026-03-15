export default function Page() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.22)] bg-white shadow-[0_24px_60px_-38px_rgba(73,153,173,0.7)]">
      <div className="bg-[linear-gradient(140deg,rgba(73,153,173,0.18),rgba(73,153,173,0.06))] px-6 py-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgb(47,118,135)]">Subscriptions</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Recurring rental programs</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Subscription operations are not built yet, but the route is now integrated into the new admin system.
        </p>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          Future functionality can include plans, recurring billing visibility, and subscription lifecycle controls.
        </div>
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          Navigation exposure is intentional so all existing admin routes are represented consistently.
        </div>
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          The visual treatment matches settings, customers, and inventory placeholders.
        </div>
      </div>
    </section>
  );
}
