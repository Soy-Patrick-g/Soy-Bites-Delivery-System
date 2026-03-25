"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import { advanceOwnerOrder, formatCurrency, getOwnerDashboard } from "@/lib/api";
import { Order, OwnerDashboard } from "@/lib/types";

export function OwnerDashboardClient() {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const showSlowLoadNotice = useSlowLoadNotice(isLoading);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== "RESTAURANT") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getOwnerDashboard(session.token);
        setDashboard(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load restaurant dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, session]);

  async function handleAdvance(orderId: number) {
    if (!session || !dashboard) {
      return;
    }

    try {
      setActiveOrderId(orderId);
      setError(null);
      const updatedOrder = await advanceOwnerOrder(session.token, orderId);
      setDashboard({
        ...dashboard,
        orders: dashboard.orders.map((order) => (order.id === orderId ? updatedOrder : order))
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to advance order");
    } finally {
      setActiveOrderId(null);
    }
  }

  if (!isReady || isLoading) {
    return (
      <Shell>
        <div className="space-y-3">
          <p className="text-sm text-ink/70">Loading restaurant dashboard...</p>
          {showSlowLoadNotice ? (
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
              This page is taking longer to load. The request is still running.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <GateCard
          title="Restaurant login required"
          body="Sign in as a restaurant owner to manage incoming orders and view storefront performance."
          href={`/login?redirect=${encodeURIComponent("/restaurant/dashboard")}`}
          action="Login as owner"
        />
      </Shell>
    );
  }

  if (session.role !== "RESTAURANT") {
    return (
      <Shell>
        <GateCard
          title="Restaurant portal only"
          body={`You are signed in as ${session.role}. Use a restaurant owner account to access this dashboard.`}
          href="/restaurant/register"
          action="Register restaurant"
        />
      </Shell>
    );
  }

  if (error && !dashboard) {
    return (
      <Shell>
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-ink p-5 text-cream shadow-soft sm:p-6 lg:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-citrus">Owner profile</p>
          <h2 className="mt-3 text-3xl font-semibold">{dashboard?.ownerName}</h2>
          <p className="mt-2 text-sm text-cream/65">{dashboard?.ownerEmail}</p>
          <div className="mt-6 rounded-3xl bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-citrus">Allocated revenue</p>
            <p className="mt-3 text-3xl font-semibold">{formatCurrency(dashboard?.allocatedRevenue ?? 0)}</p>
            <p className="mt-2 text-sm text-cream/68">Paid food revenue currently allocated to your restaurants.</p>
          </div>

          <div className="mt-8 grid gap-4">
            {dashboard?.restaurants.map((restaurant) => (
              <article key={restaurant.id} className="rounded-3xl bg-white/8 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-citrus">{restaurant.cuisine}</p>
                {restaurant.brandName ? <p className="mt-2 text-sm text-cream/65">{restaurant.brandName}</p> : null}
                <h3 className="mt-2 text-2xl font-semibold">{restaurant.name}</h3>
                <p className="mt-3 text-sm text-cream/68">{restaurant.address}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-cream/60">
                  <span>{restaurant.averageRating.toFixed(1)} rating</span>
                  <span>{formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} typical delivery</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-olive">Incoming orders</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">Process kitchen workflow</h2>
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-olive">
              <Link href="/restaurant/menu">Manage menu</Link>
              <Link href="/restaurant/register">Register another restaurant</Link>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {dashboard?.orders.length ? (
              dashboard.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={activeOrderId === order.id}
                  onAdvance={() => void handleAdvance(order.id)}
                />
              ))
            ) : (
              <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
                No orders yet. New customer orders for your restaurants will appear here.
              </p>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Restaurant dashboard</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Process live orders for your branches</h1>
      </div>
      {children}
    </main>
  );
}

function GateCard(props: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[32px] border border-ink/10 bg-white/90 p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-semibold text-ink">{props.title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">{props.body}</p>
      <Link
        href={props.href}
        className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
      >
        {props.action}
      </Link>
    </div>
  );
}

function OrderCard(props: { order: Order; busy: boolean; onAdvance: () => void }) {
  const nextLabel =
    props.order.status === "RECEIVED"
      ? "Start preparing"
      : props.order.status === "PREPARING"
        ? "Mark out for delivery"
        : props.order.status === "OUT_FOR_DELIVERY"
          ? "Waiting for rider"
          : "Completed";

  const canAdvance = props.order.status === "RECEIVED" || props.order.status === "PREPARING";

  return (
    <article className="rounded-[28px] border border-ink/10 bg-cream px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-olive">Order #{props.order.id}</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{props.order.customerName}</h3>
          <p className="mt-2 text-sm text-ink/68">{props.order.deliveryAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{props.order.status}</p>
          <p className="mt-2 text-sm text-ink/68">{props.order.paymentStatus}</p>
          <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(props.order.total)}</p>
          <p className="mt-2 text-sm text-olive">Your allocation {formatCurrency(props.order.ownerAllocation)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-ink/55">
        {props.order.items.map((item) => (
          <span key={item.id} className="rounded-full bg-white px-3 py-2">
            {item.quantity}x {item.name}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/orders/${props.order.id}`}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
        >
          Open order
        </Link>
        <button
          type="button"
          onClick={props.onAdvance}
          disabled={props.busy || !canAdvance}
          className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {props.busy ? "Updating..." : nextLabel}
        </button>
      </div>
    </article>
  );
}
