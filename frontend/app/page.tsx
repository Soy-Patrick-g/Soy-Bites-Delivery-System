"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { LocationMap } from "@/components/LocationMap";
import { RestaurantCard } from "@/components/RestaurantCard";
import { formatCurrency, getRestaurants } from "@/lib/api";
import { RestaurantSummary } from "@/lib/types";

export default function HomePage() {
  const { itemCount, subtotal, items, isReady: isCartReady, clearCart } = useCart();
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-olive">
              Accra Delivery Network
            </p>
            <h1 className="max-w-3xl font-serif text-4xl leading-none text-ink sm:text-5xl lg:text-6xl">
              One cart, many kitchens, routed by where your customer actually is.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
              Discover restaurants by proximity, compute delivery fees from distance, simulate secure Paystack checkout,
              and follow each order from receipt to doorstep.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#marketplace"
                className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-ember/90"
              >
                Browse foods
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/70"
              >
                Open dashboard
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

      <section id="marketplace" className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Nearby now</p>
            <h2 className="mt-2 text-4xl font-serif text-ink">All restaurants, with foods you can add to cart</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink/65">
            Add dishes directly from this marketplace, then move to checkout with one cart containing items from multiple restaurants.
          </p>
        </div>

        <div className="mb-8 rounded-[30px] border border-ink/10 bg-white/90 p-6 shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-olive">Cart</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
                {isCartReady ? `${itemCount} item(s) ready for checkout` : "Loading cart..."}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/checkout"
                className="rounded-full bg-citrus px-5 py-3 text-sm font-semibold text-ink transition hover:bg-citrus/90"
              >
                Proceed to checkout
              </Link>
              {isCartReady && itemCount > 0 ? (
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cream"
                >
                  Clear cart
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink/68">
            {isCartReady && items.length > 0 ? (
              items.slice(0, 6).map((item) => (
                <span key={item.menuItemId} className="rounded-full bg-cream px-4 py-2">
                  {item.quantity}x {item.itemName} from {item.restaurantName}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-cream px-4 py-2">Your cart is empty. Start by adding food below.</span>
            )}
            {isCartReady ? (
              <span className="rounded-full bg-ink px-4 py-2 font-semibold text-cream">
                Food subtotal {formatCurrency(subtotal)}
              </span>
            ) : null}
          </div>
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
          <div className="space-y-6">
            <section className="rounded-[30px] border border-ink/10 bg-white/90 p-6 shadow-soft">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-olive">Coverage map</p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink">See who is closest before you add to cart</h3>
                </div>
                <p className="max-w-md text-sm leading-6 text-ink/65">
                  Restaurant markers are plotted from their stored coordinates, so distance and estimated delivery fee match the live backend response.
                </p>
              </div>
              <LocationMap
                restaurants={restaurants.map((restaurant) => ({
                  id: String(restaurant.id),
                  label: restaurant.name,
                  address: restaurant.address,
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                  distanceKm: restaurant.distanceKm,
                  estimatedDeliveryFee: restaurant.estimatedDeliveryFee
                }))}
              />
            </section>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
