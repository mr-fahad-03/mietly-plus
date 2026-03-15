"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(73,153,173,0.2)_0%,rgba(73,153,173,0.08)_35%,#f8fafc_70%,#f4f7f9_100%)] px-3 py-4 lg:px-6 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[700px] items-center rounded-[28px] border border-[rgba(73,153,173,0.28)] bg-white/95 shadow-[0_24px_70px_rgba(73,153,173,0.2)]">
        <section className="w-full px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[500px]">
            <Link
              href="/"
              className="mb-7 inline-flex rounded-lg border border-[rgba(73,153,173,0.24)] bg-[rgba(73,153,173,0.08)] px-3 py-1.5"
            >
              <Image src="/logo.png" alt="Mietly logo" width={112} height={36} priority />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 lg:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">{description}</p>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
