"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency, getCurrentUserOrderHistory } from "@/lib/api";
import { Order } from "@/lib/types";

export function UserDashboardClient() {
  const { isReady, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    return <Shell><p className="text-sm text-ink/70">Loading your dashboard...</p></Shell>;
  }

  if (!session) {
    return (
      <Shell>
        <GateCard
          title="Login required"
          body="Sign in to see your personal order history and the other platform portals."
          href="/login?redirect=%2Fdashboard"
          action="Login"
        />
      </Shell>
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
        ? "Admins use the admin dashboard for platform analytics."
        : session.role === "RESTAURANT"
          ? "Restaurant owners use the restaurant dashboard to process orders."
          : "Delivery personnel use the delivery dashboard to claim routes and complete drop-offs.";

    return (
      <Shell>
        <GateCard
          title="Role-based portal"
          body={portalBody}
          href={portalHref}
          action={portalAction}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-soft">
        <div className="flex items-end justify-between gap-4">
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
                    <p className="text-sm font-semibold text-ink">{order.status}</p>
                    <p className="mt-2 text-sm text-ink/68">{order.paymentStatus}</p>
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
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Dashboard</p>
        <h1 className="mt-2 font-serif text-5xl text-ink">Your account, orders, and next steps</h1>
      </div>
      {children}
    </main>
  );
}

function GateCard(props: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
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
