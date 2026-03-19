"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { formatCurrency, getRestaurants } from "@/lib/api";
import { RestaurantSummary } from "@/lib/types";

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load restaurants");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRestaurants();
  }, []);

  const fastest = restaurants[0];

  return (
    <main className="pb-20">
      <section className="hero-grid bg-grid">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-olive">
              Accra Delivery Network
            </p>
            <h1 className="max-w-3xl font-serif text-5xl leading-none text-ink sm:text-6xl">
              One cart, many kitchens, routed by where your customer actually is.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
              Discover restaurants by proximity, compute delivery fees from distance, simulate secure Paystack checkout,
              and follow each order from receipt to doorstep.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/checkout?restaurant=1"
                className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-ember/90"
              >
                Start checkout
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/70"
              >
                Open admin view
              </Link>
            </div>
          </div>

          <div className="mesh-card rounded-[36px] border border-white/60 p-8 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">Live location pulse</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-ink p-5 text-cream">
                <p className="text-sm text-cream/65">Closest restaurant</p>
                <h2 className="mt-3 text-3xl font-semibold">{fastest?.name ?? "Loading..."}</h2>
                <p className="mt-3 text-sm text-cream/70">
                  {fastest?.distanceKm?.toFixed(1) ?? "--"} km away with estimated delivery at{" "}
                  {formatCurrency(fastest?.estimatedDeliveryFee ?? 0)}.
                </p>
              </div>
              <div className="rounded-3xl bg-citrus/30 p-5">
                <p className="text-sm text-ink/60">Platform edge</p>
                <ul className="mt-3 space-y-3 text-sm text-ink/80">
                  <li>Multi-vendor menus with role-aware access</li>
                  <li>Dynamic fees using restaurant distance</li>
                  <li>Order lifecycle tracking and reviews</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Nearby now</p>
            <h2 className="mt-2 text-4xl font-serif text-ink">Restaurants matched to the customer location</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink/65">
            Results here are loaded from the live backend using seeded coordinates for distance-aware discovery.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-[28px] border border-ink/10 bg-white/90 p-6 text-sm text-ink/70 shadow-soft">
            Loading restaurants...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-300/40 bg-red-500/10 p-6 text-sm text-red-700 shadow-soft">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
