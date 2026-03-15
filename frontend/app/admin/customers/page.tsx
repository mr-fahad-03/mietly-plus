export default function Page() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.22)] bg-white shadow-[0_24px_60px_-38px_rgba(73,153,173,0.7)]">
      <div className="bg-[linear-gradient(140deg,rgba(73,153,173,0.18),rgba(73,153,173,0.06))] px-6 py-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgb(47,118,135)]">Customers</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Customer relationship workspace</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          This module is pending implementation, but it now sits in the same visual system as the rest of the admin.
        </p>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          Customer profiles, order history, and identity verification summaries will live here.
        </div>
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          The route is exposed in navigation so the IA matches the actual admin surface.
        </div>
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          When implemented, this page should reuse the same table, drawer, and badge patterns as orders and support.
        </div>
      </div>
    </section>
  );
}
