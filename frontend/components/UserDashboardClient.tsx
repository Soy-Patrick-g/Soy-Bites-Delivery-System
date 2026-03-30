"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RouteLoader } from "@/components/RouteLoader";
import { AppShell } from "@/components/layout/AppShell";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import { formatCurrency, getCurrentUserOrderHistory } from "@/lib/api";
import { formatOrderStatus, formatPaymentStatus } from "@/lib/order-display";
import { Order } from "@/lib/types";

export function UserDashboardClient() {
  const { isReady, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showSlowLoadNotice = useSlowLoadNotice(isLoading);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== "USER") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getCurrentUserOrderHistory(session.token);
        setOrders(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load order history");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, session]);

  if (!isReady || isLoading) {
    return (
      <AppShell>
        <RouteLoader
          fullScreen={false}
          title="Preparing your dashboard"
          message={showSlowLoadNotice
            ? "This is taking longer than usual, but your dashboard is still loading."
            : "Loading your order history and account activity."}
        />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <div className="mb-8">
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Your account, orders, and next steps</h1>
        </div>
        <GateCard
          title="Login required"
          body="Sign in to see your order history, receipts, and account activity."
          href="/login?redirect=%2Fdashboard"
          action="Login"
        />
      </AppShell>
    );
  }

  if (session.role !== "USER") {
    const portalHref =
      session.role === "ADMIN"
        ? "/admin"
        : session.role === "RESTAURANT"
          ? "/restaurant/dashboard"
          : "/delivery/dashboard";
    const portalAction =
      session.role === "ADMIN"
        ? "Open admin dashboard"
        : session.role === "RESTAURANT"
          ? "Open restaurant dashboard"
          : "Open delivery dashboard";
    const portalBody =
      session.role === "ADMIN"
        ? "Admin accounts use the admin dashboard."
        : session.role === "RESTAURANT"
          ? "Restaurant accounts use the restaurant dashboard to manage orders and menus."
          : "Delivery accounts use the delivery dashboard to claim routes and complete deliveries.";

    return (
      <AppShell>
        <div className="mb-8">
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Your account, orders, and next steps</h1>
        </div>
        <GateCard
          title="Different account type"
          body={portalBody}
          href={portalHref}
          action={portalAction}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Your account, orders, and next steps</h1>
      </div>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-olive">Order history</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Everything you’ve ordered</h2>
          </div>
          <Link href="/checkout" className="text-sm font-semibold text-olive">
            Start new order
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {orders.length ? (
            orders.map((order) => (
              <article key={order.id} className="rounded-[28px] bg-cream px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-olive">Order #{order.id}</p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">{order.restaurantName}</h3>
                    <p className="mt-2 text-sm text-ink/68">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{formatOrderStatus(order.status)}</p>
                    <p className="mt-2 text-sm text-ink/68">{formatPaymentStatus(order.paymentStatus)}</p>
                    <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-ink/55">
                  {order.items.map((item) => (
                    <span key={item.id} className="rounded-full bg-white px-3 py-2">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/orders/${order.id}`}
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
                  >
                    View order
                  </Link>
                  {order.status === "DELIVERED" && !order.reviewed ? (
                    <Link
                      href={`/orders/${order.id}#review`}
                      className="rounded-full border border-olive/15 bg-white px-4 py-2 text-sm font-semibold text-olive"
                    >
                      Review restaurant
                    </Link>
                  ) : null}
                  <Link
                    href={`/orders/${order.id}/receipt`}
                    className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white"
                  >
                    Receipt
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
              You have not placed any orders yet.
            </p>
          )}
        </div>
      </section>
    </AppShell>
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
