import Link from "next/link";
import { formatCurrency } from "@/lib/api";
import { RestaurantSummary } from "@/lib/types";

type RestaurantCardProps = {
  restaurant: RestaurantSummary;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group rounded-[28px] border border-ink/10 bg-white/90 p-6 shadow-soft transition hover:-translate-y-1 hover:border-ember/30"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">
            {restaurant.cuisine}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-ink">{restaurant.name}</h3>
        </div>
        <span className="rounded-full bg-citrus/20 px-3 py-1 text-sm font-medium text-ink">
          {restaurant.averageRating.toFixed(1)} / 5
        </span>
      </div>
      <p className="mb-5 text-sm leading-6 text-ink/70">{restaurant.description}</p>
      <div className="flex items-center justify-between text-sm text-ink/70">
        <span>{restaurant.distanceKm?.toFixed(1) ?? "Nearby"} km away</span>
        <span>{formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} delivery</span>
      </div>
    </Link>
  );
}

