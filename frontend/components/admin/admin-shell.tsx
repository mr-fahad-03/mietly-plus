"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getAdminMe } from "@/lib/api";

const PRIMARY_MENU = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Support Requests", href: "/admin/support-requests" },
  { label: "Customers", href: "/admin/customers" },
];

const CATALOG_MENU = [
  { label: "Categories", href: "/admin/categories" },
  { label: "Brands", href: "/admin/brands" },
  { label: "Banners", href: "/admin/banners" },
  { label: "Blogs", href: "/admin/blogs" },
  { label: "Inventory", href: "/admin/inventory" },
];

const BUSINESS_MENU = [
  { label: "Subscriptions", href: "/admin/subscriptions" },
  { label: "Settings", href: "/admin/settings" },
];

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [productsOpen, setProductsOpen] = useState(pathname.startsWith("/admin/products"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pageTitle = useMemo(() => {
    if (pathname === "/admin/products") return "Add Product";
    if (pathname.startsWith("/admin/products/list")) return "Product List";
    if (pathname.startsWith("/admin/products/bulk")) return "Add Bulk Products";
    if (pathname.startsWith("/admin/blogs")) return "Blogs";
    const current = [...PRIMARY_MENU, ...CATALOG_MENU, ...BUSINESS_MENU].find((item) => item.href === pathname);
    return current?.label || "Admin";
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) return;

    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    getAdminMe(token)
      .then((payload) => {
        setAdminName(payload.admin.name);
        setReady(true);
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
      });
  }, [isLoginPage, router]);

  const onLogout = () => {
    localStorage.removeItem("admin_token");
    router.replace("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="admin-login-theme flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-600">
        Checking admin session...
      </div>
    );
  }

  const renderNavLink = (label: string, href: string) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`admin-nav-link ${active ? "admin-nav-link-active" : ""}`}
      >
        {label}
      </Link>
    );
  };

  const renderNavSection = (title: string, items: Array<{ label: string; href: string }>) => (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">{title}</p>
      <div className="space-y-1">{items.map((item) => renderNavLink(item.label, item.href))}</div>
    </div>
  );

  return (
    <div className="admin-theme h-screen overflow-hidden bg-zinc-100">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="hidden h-screen flex-col border-r border-white/10 bg-[linear-gradient(180deg,#0d1820_0%,#143141_55%,#102430_100%)] p-5 text-zinc-100 lg:flex">
          <Link href="/" className="admin-brand-panel">
            <Image src="/logo.png" alt="Mietly logo" width={140} height={44} priority />
          </Link>

          <nav className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
            {renderNavSection("Overview", PRIMARY_MENU)}
            {renderNavSection("Catalog", CATALOG_MENU)}
            <div className="space-y-2">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Products</p>
              <button
                type="button"
                onClick={() => setProductsOpen((v) => !v)}
                className={`admin-nav-link ${pathname.startsWith("/admin/products") ? "admin-nav-link-active" : ""}`}
              >
                <span>Products</span>
                <span className="text-xs">{productsOpen ? "-" : "+"}</span>
              </button>
              {productsOpen ? (
                <div className="space-y-1 pl-4">
                  {renderNavLink("List Products", "/admin/products/list")}
                  {renderNavLink("Add Product", "/admin/products")}
                  {renderNavLink("Bulk Import", "/admin/products/bulk")}
                </div>
              ) : null}
            </div>
            {renderNavSection("Business", BUSINESS_MENU)}
          </nav>

          <div className="mt-6">
            <button type="button" onClick={onLogout} className="admin-secondary-button px-3 py-1.5 text-sm">
              Log out
            </button>
          </div>
        </aside>

        <div className="flex h-screen flex-col overflow-hidden">
          <header className="border-b border-[rgba(73,153,173,0.16)] bg-white/88 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[rgb(73,153,173)]">
                  Mietly Admin
                </p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-zinc-900 md:text-2xl">
                  {pageTitle}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((value) => !value)}
                  className="admin-secondary-button lg:hidden"
                >
                  Menu
                </button>
                <Link href="/" className="admin-secondary-button">
                  View Storefront
                </Link>
              </div>
            </div>

            {mobileNavOpen ? (
              <div className="admin-mobile-nav mt-4 space-y-4 rounded-[24px] border border-[rgba(73,153,173,0.18)] bg-[linear-gradient(180deg,rgba(73,153,173,0.14),rgba(73,153,173,0.05))] p-4 lg:hidden">
                {renderNavSection("Overview", PRIMARY_MENU)}
                {renderNavSection("Catalog", CATALOG_MENU)}
                <div className="space-y-2">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[rgb(47,118,135)]/70">
                    Products
                  </p>
                  <div className="space-y-1">
                    {renderNavLink("List Products", "/admin/products/list")}
                    {renderNavLink("Add Product", "/admin/products")}
                    {renderNavLink("Bulk Import", "/admin/products/bulk")}
                  </div>
                </div>
                {renderNavSection("Business", BUSINESS_MENU)}
              </div>
            ) : null}
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="rounded-[30px] border border-[rgba(73,153,173,0.16)] bg-white/78 p-4 shadow-[0_24px_70px_-42px_rgba(73,153,173,0.8)] backdrop-blur md:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
