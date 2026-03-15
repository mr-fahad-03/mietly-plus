"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RefObject, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { fetchCategoryTree, getCurrentUser } from "@/lib/api";
import { getCartCount, subscribeCartChange } from "@/lib/cart";
import { FALLBACK_CATEGORIES } from "@/lib/constants";
import { useSiteLocale } from "@/lib/use-site-locale";
import { useWishlist } from "@/lib/use-wishlist";
import { Category, Locale } from "@/lib/types";

const copy = {
  en: {
    promo: "LIMITED-TIME MEGA DEAL: Up to 40% OFF Premium Tech Rentals",
    search: "Search for products...",
    allCategories: "All categories",
    welcome: "Welcome",
    signUp: "Sign up",
    logIn: "Log in",
    signedIn: "Signed in",
    myProfile: "My Profile",
    logout: "Log out",
    inviteFriends: "Invite Friends",
    helpCenter: "Help Center",
  },
  de: {
    promo: "MEGA-ANGEBOT NUR KURZ: Bis zu 40% Rabatt auf Premium-Tech-Mieten",
    search: "Suche nach Produkten...",
    allCategories: "Alle Kategorien",
    welcome: "Willkommen",
    signUp: "Registrieren",
    logIn: "Einloggen",
    signedIn: "Angemeldet",
    myProfile: "Mein Profil",
    logout: "Abmelden",
    inviteFriends: "Freunde einladen",
    helpCenter: "Hilfe-Center",
  },
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

function useOutsideClose(ref: RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [onClose, ref]);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 18.5c1.5-2 3.2-3 5.5-3s4 .9 5.5 3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20s-7-4.8-9-9a5.5 5.5 0 019.1-5.4L12 6l-.1-.4A5.5 5.5 0 0121 11c-2 4.2-9 9-9 9z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.2 11h11l2-8H6.2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  );
}

function LanguageFlag({ locale }: { locale: Locale }) {
  if (locale === "de") {
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 rounded-full border border-[rgba(73,153,173,0.35)]"
      style={{
        background:
          "linear-gradient(to bottom, #111111 0 33%, #dd0000 33% 66%, #ffce00 66% 100%)",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(73,153,173,0.35)] bg-[rgb(73,153,173)] text-[10px] font-bold text-white"
    >
      EN
    </span>
  );
}

function NavCategoryItem({
  category,
  locale,
  level = 0,
}: {
  category: Category;
  locale: Locale;
  level?: number;
}) {
  const hasChildren = Boolean(category.children?.length);
  const dropdownClass =
    level === 0
      ? "absolute left-0 top-full mt-2"
      : "absolute left-full top-0 ml-2";
  const linkClass =
    level === 0
      ? "text-white hover:bg-white/20 hover:text-white"
      : "text-zinc-800 hover:bg-[rgba(73,153,173,0.10)] hover:text-[rgb(73,153,173)]";

  return (
    <div className="group/item relative">
      <Link
        href={`/shop?category=${category.slug}`}
        className={`inline-flex whitespace-nowrap rounded-md px-2 py-1.5 transition ${linkClass}`}
      >
        {category.name[locale]}
      </Link>

      {hasChildren ? (
        <div
          className={`${dropdownClass} invisible z-40 min-w-56 rounded-xl border border-zinc-200 bg-white p-2 opacity-0 shadow-xl transition duration-150 group-hover/item:visible group-hover/item:opacity-100`}
        >
          {category.children!.map((child) => (
            <NavCategoryItem key={child.id} category={child} locale={locale} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarCategoryItem({
  category,
  locale,
  level = 0,
  onNavigate,
}: {
  category: Category;
  locale: Locale;
  level?: number;
  onNavigate: () => void;
}) {
  return (
    <div>
      <Link
        href={`/shop?category=${category.slug}`}
        onClick={onNavigate}
        className="block rounded-lg py-2 text-sm text-zinc-800 hover:bg-[rgba(73,153,173,0.10)] hover:text-[rgb(73,153,173)]"
        style={{ paddingLeft: `${12 + level * 14}px` }}
      >
        {category.name[locale]}
      </Link>
      {category.children?.map((child) => (
        <SidebarCategoryItem
          key={child.id}
          category={child}
          locale={locale}
          level={level + 1}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function ClientNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const NAVBAR_CATEGORY_LIMIT = 8;
  const { locale, setLocale } = useSiteLocale("de");
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const cartCount = useSyncExternalStore(subscribeCartChange, getCartCount, () => 0);
  const { productIds: wishlistIds } = useWishlist();
  const languageRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useOutsideClose(languageRef, () => setLanguageOpen(false));
  useOutsideClose(profileRef, () => setProfileOpen(false));

  useEffect(() => {
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, []);

  useEffect(() => {
    fetchCategoryTree().then((data) => {
      setCategories(data);
    });

    const token = localStorage.getItem("user_token");
    if (token) {
      getCurrentUser(token)
        .then((payload) => {
          setCurrentUser(payload.user);
        })
        .catch(() => {
          localStorage.removeItem("user_token");
          setCurrentUser(null);
        });
    }
  }, []);

  const topCategories = useMemo(
    () => categories.filter((category) => !category.parentId).slice(0, NAVBAR_CATEGORY_LIMIT),
    [categories]
  );

  const onUserLogout = () => {
    localStorage.removeItem("user_token");
    setCurrentUser(null);
    setProfileOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-white shadow-md">
      <div className="bg-[rgb(73,153,173)] px-4 py-1.5 text-center text-[13px] font-extrabold tracking-[0.05em] text-white md:text-[15px]">
        {copy[locale].promo}
      </div>
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-4 py-4 lg:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Mietly logo" width={120} height={40} priority />
        </Link>

        <div className="hidden flex-1 items-center rounded-full border border-[rgba(73,153,173,0.35)] bg-white px-4 py-3 text-[rgb(73,153,173)] md:flex">
          <SearchIcon />
          <input
            placeholder={copy[locale].search}
            className="ml-3 w-full bg-transparent text-lg outline-none"
          />
        </div>

        <nav className="ml-auto flex items-center gap-3 text-sm font-semibold text-[rgb(60,138,158)] lg:gap-5">
          <div className="relative" ref={languageRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-[rgba(73,153,173,0.35)] bg-white px-3 py-1.5 text-[rgb(73,153,173)] hover:border-[rgb(86,165,184)]"
              onClick={() => setLanguageOpen((v) => !v)}
            >
              <LanguageFlag locale={locale} />
              <span className="uppercase">{locale}</span>
              <span className="text-xs text-[rgb(73,153,173)]">v</span>
            </button>
            {languageOpen ? (
              <div className="absolute right-0 z-50 mt-2 min-w-36 overflow-hidden rounded-xl border border-[rgba(73,153,173,0.22)] bg-white text-zinc-900 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(73,153,173,0.10)]"
                  onClick={() => {
                    setLocale("en");
                    setLanguageOpen(false);
                  }}
                >
                  <LanguageFlag locale="en" />
                  <span>English</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(73,153,173,0.10)]"
                  onClick={() => {
                    setLocale("de");
                    setLanguageOpen(false);
                  }}
                >
                  <LanguageFlag locale="de" />
                  <span>Deutsch</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative hidden lg:block" ref={profileRef}>
            <button
              type="button"
              className="rounded-full border-2 border-[rgba(73,153,173,0.35)] p-1 text-[rgb(73,153,173)] transition hover:border-[rgb(86,165,184)]"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <ProfileIcon />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 z-50 mt-3 w-[92vw] max-w-80 overflow-hidden rounded-3xl border border-[rgba(73,153,173,0.22)] bg-white text-zinc-900 shadow-xl">
                <div className="space-y-4 p-6">
                  {currentUser ? (
                    <div>
                      <p className="text-xl font-bold text-[rgb(47,118,135)] md:text-2xl">{currentUser.name}</p>
                      <p className="text-sm text-zinc-500">{currentUser.email}</p>
                      <p className="mt-2 inline-flex rounded-full bg-[rgba(73,153,173,0.14)] px-2 py-1 text-xs font-semibold text-[rgb(60,138,158)]">
                        {copy[locale].signedIn}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-[rgb(47,118,135)] md:text-3xl">{copy[locale].welcome}</p>
                      <div className="flex gap-3">
                        <Link
                          href="/signup"
                          className="flex-1 rounded-full bg-[rgb(73,153,173)] px-4 py-2 text-center text-base font-bold text-white transition hover:bg-[rgb(60,138,158)] md:text-lg"
                        >
                          {copy[locale].signUp}
                        </Link>
                        <Link
                          href="/signin"
                          className="flex-1 rounded-full border-2 border-[rgb(73,153,173)] px-4 py-2 text-center text-base font-bold text-[rgb(73,153,173)] transition hover:bg-[rgba(73,153,173,0.10)] md:text-lg"
                        >
                          {copy[locale].logIn}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
                <div className="border-t border-[rgba(73,153,173,0.22)] p-6 text-xl text-zinc-800">
                  {currentUser ? (
                    <div className="space-y-2">
                      <Link
                        href="/profile"
                        className="block w-full rounded-lg border border-[rgba(73,153,173,0.35)] px-3 py-2 text-left text-base font-semibold text-[rgb(73,153,173)] hover:bg-[rgba(73,153,173,0.10)]"
                      >
                        {copy[locale].myProfile}
                      </Link>
                      <button
                        type="button"
                        onClick={onUserLogout}
                        className="block w-full rounded-lg border border-[rgba(73,153,173,0.35)] px-3 py-2 text-left text-base font-semibold text-[rgb(73,153,173)] hover:bg-[rgba(73,153,173,0.10)]"
                      >
                        {copy[locale].logout}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button type="button" className="mb-4 block text-left">
                        {copy[locale].inviteFriends}
                      </button>
                      <button type="button" className="block text-left">
                        {copy[locale].helpCenter}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href="/wishlist"
            aria-label="wishlist"
            className="relative hidden text-[rgb(73,153,173)] transition hover:text-[rgb(60,138,158)] lg:inline-flex"
          >
            <HeartIcon />
            {wishlistIds.length > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(73,153,173)] px-1 text-xs font-bold text-white">
                {wishlistIds.length}
              </span>
            ) : null}
          </Link>
          <Link
            href="/cart"
            aria-label="cart"
            className="relative hidden text-[rgb(73,153,173)] transition hover:text-[rgb(60,138,158)] lg:inline-flex"
          >
            <CartIcon />
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(73,153,173)] px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label="Open category sidebar"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex lg:hidden"
          >
            <MenuIcon />
          </button>
        </nav>
      </div>

      <div className="hidden border-t border-[rgb(60,138,158)] bg-[rgb(73,153,173)] lg:block">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-5 px-4 py-3 text-sm font-medium text-white lg:text-base">
          <Link href="/shop" className="whitespace-nowrap rounded-md px-2 py-1.5 transition hover:bg-white/15 hover:text-white">
            {copy[locale].allCategories}
          </Link>
          {topCategories.map((category) => (
            <NavCategoryItem key={category.id} category={category} locale={locale} />
          ))}
        </div>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <aside
            className="h-full w-[86vw] max-w-[320px] overflow-y-auto border-r border-zinc-200 bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900">{copy[locale].allCategories}</h2>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-md border border-[rgba(73,153,173,0.35)] px-2 py-1 text-xs text-[rgb(73,153,173)]"
              >
                Close
              </button>
            </div>
            <div className="space-y-0.5">
              {topCategories.map((category) => (
                <SidebarCategoryItem
                  key={category.id}
                  category={category}
                  locale={locale}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(73,153,173,0.22)] bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 px-1 py-1">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
              pathname === "/" ? "text-[rgb(73,153,173)]" : "text-zinc-600"
            }`}
          >
            <HomeIcon />
            <span>Home</span>
          </Link>
          <Link
            href="/shop"
            className={`flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
              pathname.startsWith("/shop") ? "text-[rgb(73,153,173)]" : "text-zinc-600"
            }`}
          >
            <ShopIcon />
            <span>Shop</span>
          </Link>
          <Link
            href="/cart"
            className={`relative flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
              pathname.startsWith("/cart") ? "text-[rgb(73,153,173)]" : "text-zinc-600"
            }`}
          >
            <CartIcon />
            {cartCount > 0 ? (
              <span className="absolute right-4 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(73,153,173)] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
            <span>Cart</span>
          </Link>
          <Link
            href="/wishlist"
            className={`relative flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
              pathname.startsWith("/wishlist") ? "text-[rgb(73,153,173)]" : "text-zinc-600"
            }`}
          >
            <HeartIcon />
            {wishlistIds.length > 0 ? (
              <span className="absolute right-4 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(73,153,173)] px-1 text-[10px] font-bold text-white">
                {wishlistIds.length}
              </span>
            ) : null}
            <span>WishList</span>
          </Link>
          <Link
            href={currentUser ? "/profile" : "/signin"}
            className={`flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
              pathname.startsWith("/profile") || pathname.startsWith("/signin")
                ? "text-[rgb(73,153,173)]"
                : "text-zinc-600"
            }`}
          >
            <ProfileIcon />
            <span>Account</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

