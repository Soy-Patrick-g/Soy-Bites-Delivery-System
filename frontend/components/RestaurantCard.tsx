"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatCurrency, getRestaurant } from "@/lib/api";
import { RestaurantPreviewItem, RestaurantSummary } from "@/lib/types";

type RestaurantCardProps = {
  restaurant: RestaurantSummary;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { addItem, getQuantity } = useCart();
  const [previewItems, setPreviewItems] = useState<RestaurantPreviewItem[]>(restaurant.featuredItems ?? []);

  useEffect(() => {
    async function loadFreshMenu() {
      try {
        const detail = await getRestaurant(String(restaurant.id));
        setPreviewItems(
          [...detail.menu]
            .sort((left, right) => right.id - left.id)
            .slice(0, 3)
            .map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl
            }))
        );
      } catch {
        setPreviewItems(restaurant.featuredItems ?? []);
      }
    }

    void loadFreshMenu();
  }, [restaurant.featuredItems, restaurant.id]);

  return (
    <article className="rounded-[28px] border border-ink/10 bg-white/90 p-6 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">
            {restaurant.cuisine}
          </p>
          {restaurant.brandName ? (
            <p className="mt-2 text-sm font-semibold text-ink/60">{restaurant.brandName}</p>
          ) : null}
          <h3 className="mt-2 text-2xl font-semibold text-ink">{restaurant.name}</h3>
          {restaurant.brandName && restaurant.brandName !== restaurant.name ? (
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-olive">Branch</p>
          ) : null}
        </div>
        <span className="rounded-full bg-citrus/20 px-3 py-1 text-sm font-medium text-ink">
          {restaurant.averageRating.toFixed(1)} / 5
        </span>
      </div>
      <p className="mb-5 text-sm leading-6 text-ink/70">{restaurant.description}</p>
      <div className="mb-5 grid gap-3">
        {previewItems.slice(0, 3).map((item) => (
          <div key={item.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl bg-cream/80 px-3 py-3">
            <div className="relative h-[72px] overflow-hidden rounded-2xl bg-cream">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-cream" />
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-olive">Featured dish</p>
                <p className="mt-2 text-sm font-semibold text-ink">{formatCurrency(item.price)}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem({
                    menuItemId: item.id,
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    itemName: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl
                  })
                }
                className="rounded-full bg-ember px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-ember/90"
              >
                {getQuantity(item.id) > 0 ? `Add more (${getQuantity(item.id)})` : "Add to cart"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink/70">
        <span>{restaurant.distanceKm?.toFixed(1) ?? "Nearby"} km away</span>
        <span>{formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} delivery</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
        >
          View full menu
        </Link>
        <Link
          href="/checkout"
          className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-ink transition hover:bg-citrus/90"
        >
          Go to cart
        </Link>
      </div>
    </article>
  );
}
