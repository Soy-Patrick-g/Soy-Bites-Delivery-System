"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { claimDeliveryOrder, completeDeliveryOrder, formatCurrency, getDeliveryDashboard } from "@/lib/api";
import { DeliveryDashboard, Order } from "@/lib/types";

export function DeliveryDashboardClient() {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<DeliveryDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== "DELIVERY") {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getDeliveryDashboard(session.token);
        setDashboard(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load delivery dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, session]);

  async function handleClaim(orderId: number) {
    if (!session || !dashboard) {
      return;
    }

    try {
      setBusyOrderId(orderId);
      setError(null);
      const updatedOrder = await claimDeliveryOrder(session.token, orderId);
      setDashboard({
        ...dashboard,
        availableOrders: dashboard.availableOrders.filter((order) => order.id !== orderId),
        assignedOrders: [updatedOrder, ...dashboard.assignedOrders.filter((order) => order.id !== orderId)]
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to claim order");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function handleComplete(orderId: number) {
    if (!session || !dashboard) {
      return;
    }

    try {
      setBusyOrderId(orderId);
      setError(null);
      const updatedOrder = await completeDeliveryOrder(session.token, orderId);
      setDashboard({
        ...dashboard,
        assignedOrders: dashboard.assignedOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to complete order");
    } finally {
      setBusyOrderId(null);
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

  return (
    <Shell>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.18em] text-citrus">Rider profile</p>
          <h2 className="mt-3 text-3xl font-semibold">{dashboard?.driverName}</h2>
          <p className="mt-2 text-sm text-cream/65">{dashboard?.driverEmail}</p>

          <div className="mt-8 grid gap-4">
            <article className="rounded-3xl bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-citrus">Available routes</p>
              <h3 className="mt-2 text-3xl font-semibold">{dashboard?.availableOrders.length ?? 0}</h3>
              <p className="mt-3 text-sm text-cream/68">Orders already prepared and waiting for a rider claim.</p>
            </article>
            <article className="rounded-3xl bg-white/8 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-citrus">Active drop-offs</p>
              <h3 className="mt-2 text-3xl font-semibold">{activeAssignments.length}</h3>
              <p className="mt-3 text-sm text-cream/68">Orders currently assigned to you and still on the road.</p>
            </article>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-soft">
          <div className="flex items-end justify-between gap-4">
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
              {dashboard?.availableOrders.length ? (
                dashboard.availableOrders.map((order) => (
                  <DeliveryCard
                    key={order.id}
                    order={order}
                    busy={busyOrderId === order.id}
                    actionLabel="Claim order"
                    onAction={() => void handleClaim(order.id)}
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
              {activeAssignments.length ? (
                activeAssignments.map((order) => (
                  <DeliveryCard
                    key={order.id}
                    order={order}
                    busy={busyOrderId === order.id}
                    actionLabel="Mark delivered"
                    onAction={() => void handleComplete(order.id)}
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
              {completedAssignments.length ? (
                completedAssignments.map((order) => (
                  <DeliveryCard key={order.id} order={order} busy={false} actionLabel="Delivered" />
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
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Delivery dashboard</p>
        <h1 className="mt-2 font-serif text-5xl text-ink">Claim routes and close out drop-offs</h1>
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
      <Link href={props.href} className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white">
        {props.action}
      </Link>
    </div>
  );
}

function DeliveryCard(props: { order: Order; busy: boolean; actionLabel: string; onAction?: () => void }) {
  return (
    <article className="rounded-[28px] border border-ink/10 bg-cream px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-olive">Order #{props.order.id}</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{props.order.restaurantName}</h3>
          <p className="mt-2 text-sm text-ink/68">{props.order.customerName}</p>
          <p className="mt-1 text-sm text-ink/68">{props.order.deliveryAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{props.order.status}</p>
          <p className="mt-2 text-sm text-ink/68">{props.order.paymentStatus}</p>
          <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(props.order.total)}</p>
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
        <Link href={`/orders/${props.order.id}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink">
          Open order
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
