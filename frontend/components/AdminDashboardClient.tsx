"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { DashboardStat } from "@/components/DashboardStat";
import { formatCurrency, getDashboard } from "@/lib/api";
import { AdminDashboard } from "@/lib/types";

export function AdminDashboardClient() {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== "ADMIN") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getDashboard(session.token);
        setDashboard(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, session]);

  if (!isReady || isLoading) {
    return <Shell><p className="text-sm text-cream/70">Loading admin dashboard...</p></Shell>;
  }

  if (!session) {
    return (
      <Shell>
        <GateCard
          title="Admin login required"
          body="Sign in with the seeded admin account to load live analytics from the backend."
          href={`/login?redirect=${encodeURIComponent("/admin")}`}
          action="Login as admin"
        />
      </Shell>
    );
  }

  if (session.role !== "ADMIN") {
    return (
      <Shell>
        <GateCard
          title="Admin access only"
          body={`You are signed in as ${session.role}. Use the admin account to open this dashboard.`}
          href={`/login?redirect=${encodeURIComponent("/admin")}`}
          action="Switch account"
        />
      </Shell>
    );
  }

  if (error || !dashboard) {
    return (
      <Shell>
        <p className="rounded-3xl border border-red-300/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error ?? "Unable to load dashboard."}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Restaurants" value={String(dashboard.totalRestaurants)} hint="Active vendors on the network" />
        <DashboardStat label="Orders" value={String(dashboard.totalOrders)} hint="Orders processed across the platform" />
        <DashboardStat label="Reviews" value={String(dashboard.totalReviews)} hint="Published customer reviews" />
        <DashboardStat label="Revenue" value={formatCurrency(dashboard.totalRevenue)} hint="Simulated GMV from initialized or paid orders" />
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <DashboardStat
          label="Owner allocations"
          value={formatCurrency(dashboard.totalOwnerAllocations)}
          hint="Food revenue already allocated to restaurant owners"
        />
        <div className="rounded-[32px] border border-white/10 bg-white/6 p-6 text-sm leading-7 text-cream/72 shadow-soft">
          Combined checkout payments are split by order subtotal, so each restaurant owner sees only the food revenue
          allocated to their own orders.
        </div>
      </section>

      <section className="mt-10 rounded-[36px] border border-white/10 bg-white/6 p-8 shadow-soft">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-citrus">Top-rated vendors</p>
            <h2 className="mt-2 text-3xl font-semibold">Customer favorites this cycle</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-cream/65">
            Live data is now being fetched with your stored admin JWT, so this view reflects the backend instead of fallback mocks.
          </p>
        </div>

        <div className="grid gap-4">
          {dashboard.topRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="grid gap-3 rounded-3xl border border-white/10 bg-white/8 p-5 md:grid-cols-[1.2fr_0.8fr_0.6fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-citrus">{restaurant.cuisine}</p>
                <h3 className="mt-2 text-2xl font-semibold">{restaurant.name}</h3>
                <p className="mt-2 text-sm text-cream/68">{restaurant.address}</p>
              </div>
              <div className="self-center text-sm text-cream/72">
                <p>{restaurant.distanceKm?.toFixed(1) ?? "--"} km typical delivery radius</p>
                <p className="mt-2">{formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} average fee</p>
              </div>
              <div className="self-center text-right text-3xl font-semibold">
                {restaurant.averageRating.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-ink py-12 text-cream">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-citrus">Admin dashboard</p>
          <h1 className="mt-2 font-serif text-5xl">Platform performance at a glance</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/70">
            Monitor vendor growth, order flow, review volume, and revenue from the secured backend using an admin login.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

function GateCard(props: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-soft">
      <h2 className="text-2xl font-semibold">{props.title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-cream/70">{props.body}</p>
      <Link
        href={props.href}
        className="mt-6 inline-flex rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-ink"
      >
        {props.action}
      </Link>
    </div>
  );
}
