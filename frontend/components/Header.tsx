"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/components/CartProvider";

export function Header() {
  const { isReady, logout, session } = useAuth();
  const { itemCount, isReady: isCartReady } = useCart();
  const router = useRouter();
  const isUser = session?.role === "USER";
  const isDelivery = session?.role === "DELIVERY";
  const isRestaurant = session?.role === "RESTAURANT";
  const isAdmin = session?.role === "ADMIN";
  const homeHref = isAdmin
    ? "/admin"
    : isRestaurant
      ? "/restaurant/dashboard"
      : isDelivery
        ? "/delivery/dashboard"
        : "/";
  const navigation = !isReady || !session
    ? [{ href: "/", label: "Discover" }]
    : isUser
      ? [
          { href: "/", label: "Discover" },
          { href: "/checkout", label: `Cart${isCartReady && itemCount > 0 ? ` (${itemCount})` : ""}` },
          { href: "/dashboard", label: "Dashboard" }
        ]
      : isAdmin
        ? [{ href: "/admin", label: "Admin dashboard" }]
        : isRestaurant
          ? [
              { href: "/restaurant/dashboard", label: "Restaurant dashboard" },
              { href: "/restaurant/menu", label: "Menu management" },
              { href: "/restaurant/withdrawals", label: "Withdrawals" }
            ]
          : isDelivery
            ? [
                { href: "/delivery/dashboard", label: "Delivery dashboard" },
                { href: "/delivery/withdrawals", label: "Withdrawals" }
              ]
            : [];

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-luxury/90 backdrop-blur">
      <div className="app-shell flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <Link href={homeHref} className="text-lg font-semibold tracking-[0.22em] text-cream uppercase">
          FoodHub
        </Link>
        <nav className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 text-sm text-cream/80 md:w-auto md:justify-end md:gap-5">
          {navigation.map((item) => (
            <Link key={item.href + item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          {isReady && session ? (
            <>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cream/70">
                {session.role}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream transition hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-[#1e1b18] transition hover:bg-citrus/90"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
