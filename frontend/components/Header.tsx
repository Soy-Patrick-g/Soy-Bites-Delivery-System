"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
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

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Link href={homeHref} className="text-lg font-semibold tracking-[0.22em] text-cream uppercase">
          FoodHub
        </Link>
        <nav className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 text-sm text-cream/80 md:w-auto md:justify-end md:gap-5">
          {!isReady || !session ? <Link href="/">Discover</Link> : null}
          {!isReady || !session ? null : isUser ? (
            <>
              <Link href="/">Discover</Link>
              <Link href="/checkout">Cart{isCartReady && itemCount > 0 ? ` (${itemCount})` : ""}</Link>
              <Link href="/dashboard">Dashboard</Link>
            </>
          ) : isAdmin ? (
            <>
              <Link href="/admin">Control tower</Link>
            </>
          ) : isRestaurant ? (
            <>
              <Link href="/restaurant/dashboard">Kitchen board</Link>
              <Link href="/restaurant/menu">Menu management</Link>
            </>
          ) : isDelivery ? (
            <>
              <Link href="/delivery/dashboard">Dispatch board</Link>
              <Link href="/delivery/register">Register rider</Link>
            </>
          ) : null}
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
              className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-ink transition hover:bg-citrus/90"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
