"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = await adminLogin({ email: email.trim(), password: password.trim() });
      localStorage.setItem("admin_token", payload.token);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-theme flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[rgba(73,153,173,0.25)] bg-white shadow-[0_24px_60px_-36px_rgba(73,153,173,0.85)]">
        <div className="border-b border-[rgba(73,153,173,0.18)] bg-[linear-gradient(120deg,rgba(73,153,173,0.2),rgba(73,153,173,0.06))] px-6 py-6">
          <Image src="/logo.png" alt="Mietly logo" width={140} height={44} priority />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-700">Sign in to manage products, orders and settings.</p>
        </div>
        <form className="space-y-4 px-6 py-6" onSubmit={onSubmit} autoComplete="off">
          <input type="text" name="fake_username" autoComplete="username" className="hidden" tabIndex={-1} />
          <input type="password" name="fake_password" autoComplete="current-password" className="hidden" tabIndex={-1} />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-zinc-700">Admin Email</span>
            <input
              type="email"
              name="admin_login_email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.2)]"
              placeholder="Enter admin email"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-zinc-700">Password</span>
            <input
              type="password"
              name="admin_login_password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[rgb(73,153,173)] focus:ring-2 focus:ring-[rgba(73,153,173,0.2)]"
              placeholder="Enter password"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[rgb(73,153,173)] px-4 py-2.5 font-bold text-white shadow-[0_16px_30px_-18px_rgba(73,153,173,0.9)] transition hover:bg-[rgb(60,138,158)] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in as admin"}
          </button>
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}
