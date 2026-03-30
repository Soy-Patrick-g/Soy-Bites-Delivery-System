"use client";

import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";
import { ReorderDeliveredOrderButton } from "@/components/ReorderDeliveredOrderButton";
import { StarRatingDisplay } from "@/components/StarRatingDisplay";
import { APP_NAME } from "@/lib/brand";
import type { Order } from "@/lib/types";

export function CompletedOrderSpotlight({ order }: { order: Order }) {
  const { session } = useAuth();

  if (order.status !== "DELIVERED") {
    return null;
  }

  return (
    <section className="mt-8 surface-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow">Completed delivery</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Your order has been completed</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/70">
            Review who handled your order, see the restaurant’s current rating, and place the same meal again in one tap.
          </p>
        </div>
        {session?.role === "USER" ? <ReorderDeliveredOrderButton order={order} /> : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] bg-cream px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Delivered by</p>
          <div className="mt-4 flex items-center gap-4">
            <Avatar
              name={order.deliveryPersonName || "Delivery partner"}
              src={order.deliveryPersonProfileImageUrl}
              className="h-16 w-16 border border-white/60"
            />
            <div>
              <h3 className="text-xl font-semibold text-ink">{order.deliveryPersonName || "Delivery partner assigned"}</h3>
              <p className="mt-1 text-sm text-ink/65">
                {order.deliveryPersonVehicleType ? `${order.deliveryPersonVehicleType} delivery partner` : `${APP_NAME} delivery partner`}
              </p>
              {order.completedAt ? (
                <p className="mt-1 text-sm text-ink/60">
                  Completed {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.completedAt))}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-olive">Role</p>
              <p className="mt-2 text-sm font-semibold text-ink">Delivery partner</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-olive">Completed deliveries</p>
              <p className="mt-2 text-sm font-semibold text-ink">{order.deliveryPersonCompletedDeliveries ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] bg-cream px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Restaurant snapshot</p>
          <h3 className="mt-4 text-xl font-semibold text-ink">{order.restaurantName}</h3>
          <div className="mt-4 flex items-center gap-3">
            <StarRatingDisplay rating={order.restaurantAverageRating} sizeClassName="h-5 w-5" />
            <span className="text-sm font-semibold text-ink">{order.restaurantAverageRating.toFixed(1)} average rating</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-ink/70">
            Ready for another round? Use the reorder action to send the same dishes back to your cart instantly.
          </p>
        </article>
      </div>
    </section>
  );
}
