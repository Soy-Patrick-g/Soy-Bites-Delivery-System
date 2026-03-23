"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LocationMap } from "@/components/LocationMap";
import { claimDeliveryOrder, completeDeliveryOrder, formatCurrency, getDeliveryDashboard } from "@/lib/api";
import { DeliveryDashboard, Order } from "@/lib/types";

export function DeliveryDashboardClient() {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<DeliveryDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRouteKey, setBusyRouteKey] = useState<string | null>(null);

  async function loadDashboard(token: string, showLoading = true) {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      const data = await getDeliveryDashboard(token);
      setDashboard(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load delivery dashboard");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    async function load() {
      if (!session || session.role !== "DELIVERY") {
        setIsLoading(false);
        return;
      }

      await loadDashboard(session.token);
    }

    if (isReady) {
      void load();
    }
  }, [isReady, session]);

  async function handleClaim(route: DeliveryRoute) {
    if (!session || !dashboard) {
      return;
    }

    try {
      setBusyRouteKey(route.key);
      setError(null);
      await claimDeliveryOrder(session.token, route.primaryOrder.id);
      await loadDashboard(session.token, false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to claim order");
    } finally {
      setBusyRouteKey(null);
    }
  }

  async function handleComplete(route: DeliveryRoute) {
    if (!session || !dashboard) {
      return;
    }

    try {
      setBusyRouteKey(route.key);
      setError(null);
      await completeDeliveryOrder(session.token, route.primaryOrder.id);
      await loadDashboard(session.token, false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to complete order");
    } finally {
      setBusyRouteKey(null);
    }
  }

  if (!isReady || isLoading) {
    return <Shell><p className="text-sm text-ink/70">Loading delivery dashboard...</p></Shell>;
  }

  if (!session) {
    return (
      <Shell>
        <GateCard
          title="Delivery login required"
          body="Sign in as delivery personnel to claim routes and complete drop-offs."
          href={`/login?redirect=${encodeURIComponent("/delivery/dashboard")}`}
          action="Login as rider"
        />
      </Shell>
    );
  }

  if (session.role !== "DELIVERY") {
    return (
      <Shell>
        <GateCard
          title="Delivery portal only"
          body={`You are signed in as ${session.role}. Use a delivery account to access live routes.`}
          href="/delivery/register"
          action="Register as rider"
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

  const activeAssignments = dashboard?.assignedOrders.filter((order) => order.status === "OUT_FOR_DELIVERY") ?? [];
  const completedAssignments = dashboard?.assignedOrders.filter((order) => order.status === "DELIVERED") ?? [];
  const availableRoutes = groupOrdersIntoRoutes(dashboard?.availableOrders ?? []);
  const activeRoutes = groupOrdersIntoRoutes(activeAssignments);
  const completedRoutes = groupOrdersIntoRoutes(completedAssignments);
  const focusRoute = activeRoutes[0] ?? availableRoutes[0];

  return (
    <Shell>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-ink p-5 text-cream shadow-soft sm:p-6 lg:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-citrus">Rider profile</p>
          <h2 className="mt-3 text-3xl font-semibold">{dashboard?.driverName}</h2>
          <p className="mt-2 text-sm text-cream/65">{dashboard?.driverEmail}</p>

          <div className="mt-8 grid gap-4">
            <article className="rounded-3xl bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-citrus">Available routes</p>
              <h3 className="mt-2 text-3xl font-semibold">{availableRoutes.length}</h3>
              <p className="mt-3 text-sm text-cream/68">Pickup routes that are fully ready and waiting for one rider claim.</p>
            </article>
            <article className="rounded-3xl bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-citrus">Active drop-offs</p>
              <h3 className="mt-2 text-3xl font-semibold">{activeRoutes.length}</h3>
              <p className="mt-3 text-sm text-cream/68">Routes currently assigned to you and still on the road.</p>
            </article>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs uppercase tracking-[0.16em] text-citrus">Map view</p>
            <LocationMap
              restaurants={
                focusRoute
                  ? focusRoute.orders.map((order) => ({
                      id: String(order.id),
                      label: `${order.restaurantName} • Order #${order.id}`,
                      address: order.deliveryAddress,
                      latitude: order.restaurantLatitude,
                      longitude: order.restaurantLongitude,
                      distanceKm: order.distanceKm
                    }))
                  : []
              }
              deliveryPoint={
                focusRoute
                  ? {
                      id: `delivery-${focusRoute.primaryOrder.id}`,
                      label: focusRoute.isGrouped ? "Combined delivery drop-off" : "Current drop-off focus",
                      address: focusRoute.primaryOrder.deliveryAddress,
                      latitude: focusRoute.primaryOrder.deliveryLatitude,
                      longitude: focusRoute.primaryOrder.deliveryLongitude
                    }
                  : undefined
              }
              heightClassName="h-[280px]"
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-olive">Dispatch board</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">Claim ready orders and finish deliveries</h2>
            </div>
            <Link href="/delivery/register" className="text-sm font-semibold text-olive">
              Register another rider
            </Link>
          </div>

          <section className="mt-6">
            <p className="text-xs uppercase tracking-[0.16em] text-olive">Ready to claim</p>
            <div className="mt-3 space-y-4">
              {availableRoutes.length ? (
                availableRoutes.map((route) => (
                  <DeliveryCard
                    key={route.key}
                    route={route}
                    busy={busyRouteKey === route.key}
                    actionLabel={route.isGrouped ? "Claim combined route" : "Claim order"}
                    onAction={() => void handleClaim(route)}
                  />
                ))
              ) : (
                <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
                  No unclaimed delivery routes right now.
                </p>
              )}
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs uppercase tracking-[0.16em] text-olive">Your assigned orders</p>
            <div className="mt-3 space-y-4">
              {activeRoutes.length ? (
                activeRoutes.map((route) => (
                  <DeliveryCard
                    key={route.key}
                    route={route}
                    busy={busyRouteKey === route.key}
                    actionLabel={route.isGrouped ? "Mark route delivered" : "Mark delivered"}
                    onAction={() => void handleComplete(route)}
                  />
                ))
              ) : (
                <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
                  You have no active deliveries at the moment.
                </p>
              )}
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs uppercase tracking-[0.16em] text-olive">Completed by you</p>
            <div className="mt-3 space-y-4">
              {completedRoutes.length ? (
                completedRoutes.map((route) => (
                  <DeliveryCard key={route.key} route={route} busy={false} actionLabel="Delivered" />
                ))
              ) : (
                <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/65">
                  Completed deliveries will appear here after you finish them.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Delivery dashboard</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Claim routes and close out drop-offs</h1>
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
      <Link href={props.href} className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white">
        {props.action}
      </Link>
    </div>
  );
}

function DeliveryCard(props: { route: DeliveryRoute; busy: boolean; actionLabel: string; onAction?: () => void }) {
  const order = props.route.primaryOrder;
  const totalAmount = props.route.orders.reduce((sum, current) => sum + current.total, 0);
  const totalItems = props.route.orders.reduce((sum, current) => sum + current.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return (
    <article className="rounded-[28px] border border-ink/10 bg-cream px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-olive">
            {props.route.isGrouped ? props.route.groupReference : `Order #${order.id}`}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">
            {props.route.isGrouped ? `${props.route.orders.length} restaurants, one drop-off` : order.restaurantName}
          </h3>
          <p className="mt-2 text-sm text-ink/68">{order.customerName}</p>
          <p className="mt-1 text-sm text-ink/68">{order.deliveryAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{order.status}</p>
          <p className="mt-2 text-sm text-ink/68">{order.paymentStatus}</p>
          <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(totalAmount)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink/55">{totalItems} items</p>
        </div>
      </div>

      {props.route.isGrouped ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-ink/55">
          {props.route.orders.map((current) => (
            <span key={current.id} className="rounded-full bg-white px-3 py-2">
              {current.restaurantName}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-ink/55">
        {props.route.orders.flatMap((current) =>
          current.items.map((item) => (
            <span key={`${current.id}-${item.id}`} className="rounded-full bg-white px-3 py-2">
              {props.route.isGrouped ? `${current.restaurantName}: ` : ""}{item.quantity}x {item.name}
            </span>
          ))
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={props.route.isGrouped ? `/orders/${order.id}/receipt` : `/orders/${order.id}`}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
        >
          {props.route.isGrouped ? "Open combined order" : "Open order"}
        </Link>
        {props.onAction ? (
          <button
            type="button"
            onClick={props.onAction}
            disabled={props.busy}
            className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {props.busy ? "Updating..." : props.actionLabel}
          </button>
        ) : (
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/70">{props.actionLabel}</span>
        )}
      </div>
    </article>
  );
}

type DeliveryRoute = {
  key: string;
  groupReference?: string;
  isGrouped: boolean;
  primaryOrder: Order;
  orders: Order[];
};

function groupOrdersIntoRoutes(orders: Order[]) {
  const routes = new Map<string, DeliveryRoute>();

  for (const order of orders) {
    const key = order.groupReference?.trim() ? order.groupReference : `order-${order.id}`;
    const existing = routes.get(key);

    if (existing) {
      existing.orders.push(order);
      continue;
    }

    routes.set(key, {
      key,
      groupReference: order.groupReference ?? undefined,
      isGrouped: Boolean(order.groupReference?.trim()),
      primaryOrder: order,
      orders: [order]
    });
  }

  return Array.from(routes.values());
}
