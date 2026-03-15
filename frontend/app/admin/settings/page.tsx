export default function Page() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.22)] bg-white shadow-[0_24px_60px_-38px_rgba(73,153,173,0.7)]">
      <div className="bg-[linear-gradient(140deg,rgba(73,153,173,0.18),rgba(73,153,173,0.06))] px-6 py-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgb(47,118,135)]">Settings</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Workspace configuration</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Settings screens are not built yet, but this section is now aligned with the new admin system.
        </p>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          Branding preferences and operational defaults will appear here.
        </div>
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          Email, admin permissions, storefront toggles, and notification settings are intended for this module.
        </div>
        <div className="rounded-2xl border border-[rgba(73,153,173,0.18)] bg-[rgba(73,153,173,0.05)] p-4 text-sm text-zinc-700">
          The route stays live now so it fits naturally into the redesigned navigation.
        </div>
      </div>
    </section>
  );
}
