"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function Header() {
  const { isReady, logout, session } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-[0.22em] text-cream uppercase">
          FoodHub
        </Link>
        <nav className="flex items-center gap-5 text-sm text-cream/80">
          <Link href="/">Discover</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/orders/1">Track Order</Link>
          <Link href="/admin">Admin</Link>
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
