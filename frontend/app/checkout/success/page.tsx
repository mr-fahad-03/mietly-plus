"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { clearCart } from "@/lib/cart";
import { confirmCheckoutSession } from "@/lib/api";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("user_token") || "" : "";

  useEffect(() => {
    if (!sessionId || !token) {
      clearCart();
      return;
    }

    confirmCheckoutSession(token, { sessionId })
      .then(() => clearCart())
      .catch(() => clearCart());
  }, [sessionId, token]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <ClientNavbar />
      <main className="mx-auto w-full max-w-[820px] px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logo.png" alt="Mietly logo" width={120} height={40} priority />
          </Link>
        </div>
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-4xl font-extrabold text-lime-600">Payment Successful</p>
          <p className="mt-3 text-zinc-700">
            Your order has been confirmed. Thank you for renting with Mietly.
          </p>
          {sessionId ? <p className="mt-2 text-xs text-zinc-500">Session ID: {sessionId}</p> : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-bold text-white"
            >
              Continue shopping
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              Go home
            </button>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
