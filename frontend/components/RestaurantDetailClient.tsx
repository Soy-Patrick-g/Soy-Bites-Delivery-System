"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBrowseLocation } from "@/components/BrowseLocationProvider";
import { LocationMap } from "@/components/LocationMap";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import { formatCurrency, getRestaurant } from "@/lib/api";
import { RestaurantDetail } from "@/lib/types";

export function RestaurantDetailClient({ id }: { id: string }) {
  const { location, isReady } = useBrowseLocation();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showSlowLoadNotice = useSlowLoadNotice(isLoading);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    async function loadRestaurant() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getRestaurant(id, location);
        setRestaurant(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : `Unable to load restaurant ${id}`);
      } finally {
        setIsLoading(false);
      }
    }

    void loadRestaurant();
  }, [id, isReady, location]);

  if (error) {
    return (
      <main className="app-shell py-8 sm:py-12">
        <div className="rounded-[32px] border border-red-300/40 bg-red-500/10 p-8 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      </main>
    );
  }

  if (isLoading || !restaurant) {
    return (
      <main className="app-shell py-8 sm:py-12">
        <div className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
          <p className="text-sm text-ink/70">Loading restaurant details...</p>
          {showSlowLoadNotice ? (
            <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
              This is taking longer than usual, but the restaurant details are still loading.
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell py-8 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">{restaurant.cuisine}</p>
          {restaurant.brandName ? <p className="mt-3 text-lg font-semibold text-ink/65">{restaurant.brandName}</p> : null}
          <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">{restaurant.name}</h1>
          {restaurant.brandName && restaurant.brandName !== restaurant.name ? (
            <p className="mt-3 text-sm uppercase tracking-[0.18em] text-olive">Branch location</p>
          ) : null}
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">{restaurant.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-ink/70">
            <span className="rounded-full bg-white px-4 py-2 shadow-soft">{restaurant.address}</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-soft">
              {restaurant.distanceKm?.toFixed(1) ?? "--"} km from {location.city || "your location"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-soft">
              {formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} delivery
            </span>
          </div>
        </div>

        <div className="rounded-[32px] bg-ink p-5 text-cream shadow-soft sm:p-6 lg:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-cream/60">Restaurant snapshot</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-cream/70">Average rating</p>
              <h2 className="mt-3 text-4xl font-semibold">{restaurant.averageRating.toFixed(1)}</h2>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-cream/70">Reviews</p>
              <h2 className="mt-3 text-4xl font-semibold">{restaurant.reviews.length}</h2>
            </div>
          </div>
          <div className="mt-6 rounded-3xl bg-white/8 p-5">
            <p className="text-sm text-cream/70">Distance is based on</p>
            <p className="mt-2 font-semibold">{location.address}</p>
          </div>
          <Link
            href={`/checkout?restaurant=${restaurant.id}`}
            className="mt-6 inline-flex rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-ink"
          >
            Continue to checkout
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-olive">Location map</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Restaurant mapped against your selected location</h2>
          </div>
        </div>
        <LocationMap
          restaurants={[{
            id: String(restaurant.id),
            label: restaurant.name,
            address: restaurant.address,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            distanceKm: restaurant.distanceKm,
            estimatedDeliveryFee: restaurant.estimatedDeliveryFee
          }]}
          deliveryPoint={{
            id: "browse-location",
            label: "Your selected location",
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude
          }}
        />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="font-serif text-3xl text-ink">Menu highlights</h2>
          <div className="mt-6 space-y-5">
            {restaurant.menu.length ? (
              restaurant.menu.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-soft">
                  <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                    <div className="relative min-h-[200px]">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-cream" />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-ink">{item.name}</h3>
                          <p className="mt-3 text-sm leading-6 text-ink/72">{item.description}</p>
                        </div>
                        <span className="rounded-full bg-citrus/25 px-4 py-2 text-sm font-semibold text-ink">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-3 text-xs uppercase tracking-[0.16em] text-olive">
                        {item.vegetarian ? <span>Vegetarian</span> : <span>Protein-rich</span>}
                        {item.spicy ? <span>Hot</span> : <span>Mild</span>}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[28px] border border-ink/10 bg-white/90 p-6 text-sm text-ink/70 shadow-soft">
                This restaurant has not published any menu items yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-3xl text-ink">Guest reviews</h2>
          <div className="mt-6 space-y-4">
            {restaurant.reviews.length ? (
              restaurant.reviews.map((review) => (
                <article key={review.id} className="rounded-[28px] border border-ink/10 bg-white/90 p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-ink">{review.customerName}</h3>
                    <span className="rounded-full bg-olive/10 px-3 py-1 text-sm text-olive">
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/70">{review.comment}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[28px] border border-ink/10 bg-white/90 p-6 text-sm text-ink/70 shadow-soft">
                Customer reviews will appear here once the restaurant starts receiving feedback.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
