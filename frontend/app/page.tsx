"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBrowseLocation } from "@/components/BrowseLocationProvider";
import { useCart } from "@/components/CartProvider";
import { LocationPicker } from "@/components/LocationPicker";
import { LocationMap } from "@/components/LocationMap";
import { RestaurantCard } from "@/components/RestaurantCard";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import { formatCurrency, getRestaurants } from "@/lib/api";
import { RestaurantSummary } from "@/lib/types";

export default function HomePage() {
  const {
    location,
    isReady: isBrowseLocationReady,
    isLocating,
    error: locationError,
    setLocation,
    useCurrentLocation,
    clearError
  } = useBrowseLocation();
  const { itemCount, subtotal, items, isReady: isCartReady, clearCart } = useCart();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const showSlowLoadNotice = useSlowLoadNotice(isLoading);

  useEffect(() => {
    if (!isBrowseLocationReady) {
      return;
    }

    async function loadRestaurants() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getRestaurants(location);
        setRestaurants(data);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load restaurants");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRestaurants();
  }, [isBrowseLocationReady, location]);

  const fastest = restaurants[0];

  return (
    <main className="pb-20">
      <section className="hero-grid bg-grid">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-olive">
              {location.city || "Live"} Delivery Network
            </p>
            <h1 className="max-w-3xl font-serif text-4xl leading-none text-ink sm:text-5xl lg:text-6xl">
              One cart, many kitchens, routed by where your customer actually is.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
              Discover restaurants near your chosen location, see delivery estimates before you order, and track every order from confirmation to your door.
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">Location overview</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-ink p-5 text-cream">
                <p className="text-sm text-cream/65">Closest restaurant to your selected location</p>
                <h2 className="mt-3 text-3xl font-semibold">{fastest?.name ?? "Loading..."}</h2>
                <p className="mt-3 text-sm text-cream/70">
                  {fastest?.distanceKm?.toFixed(1) ?? "--"} km away with estimated delivery at{" "}
                  {formatCurrency(fastest?.estimatedDeliveryFee ?? 0)}.
                </p>
                <p className="mt-4 text-xs text-cream/65">
                  Based on: {location.address}
                </p>
              </div>
              <div className="rounded-3xl bg-citrus/30 p-5">
                <p className="text-sm text-ink/60">Your browsing location</p>
                <p className="mt-3 text-sm font-semibold text-ink">{location.address}</p>
                <p className="mt-2 text-sm text-ink/80">
                  Change this and your nearby restaurants, distance estimates, and delivery pricing will update automatically.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void useCurrentLocation()}
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream"
                  >
                    {isLocating ? "Locating..." : "Use current location"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setIsLocationPickerVisible((current) => !current);
                    }}
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
                  >
                    {isLocationPickerVisible ? "Hide map picker" : "Choose on map"}
                  </button>
                </div>
                {locationError ? (
                  <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{locationError}</p>
                ) : null}
              </div>
            </div>
            {isLocationPickerVisible ? (
              <div className="mt-6">
                <LocationPicker
                  title="Browse from this location"
                  description="Use your current location or choose a point on the map. The marketplace will recalculate nearby restaurants and delivery estimates from here."
                  value={location}
                  onChange={(nextLocation) => {
                    setLocation(nextLocation);
                    setIsLocationPickerVisible(false);
                  }}
                  heightClassName="h-[320px]"
                />
              </div>
            ) : null}
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
            {showSlowLoadNotice ? (
              <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
                This is taking longer than usual, but the app is still waiting for the restaurants to load.
              </p>
            ) : null}
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
                  Use the map to compare restaurants around your selected area before you decide where to order from.
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
                deliveryPoint={{
                  id: "browse-location",
                  label: "Your selected location",
                  address: location.address,
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
              />
            </section>

            {restaurants.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {restaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-ink/10 bg-white/90 p-6 text-sm text-ink/70 shadow-soft">
                <p className="font-semibold text-ink">No restaurants are available for this area yet.</p>
                <p className="mt-3">
                  Try another nearby location or check back soon as more restaurants come online.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
