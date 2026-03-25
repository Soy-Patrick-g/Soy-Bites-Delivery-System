"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { LocationPicker } from "@/components/LocationPicker";
import { LocationMap } from "@/components/LocationMap";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import { formatCurrency, getRestaurants, placeGroupOrder } from "@/lib/api";
import { RestaurantSummary } from "@/lib/types";
import type { LocationSelection } from "@/lib/location";

export function CheckoutClient() {
  const router = useRouter();
  const { isReady, session } = useAuth();
  const { items, itemCount, setQuantity, subtotal, clearCart, isReady: isCartReady } = useCart();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<LocationSelection>({
    address: "East Legon, Lagos Avenue 14, Accra",
    city: "Accra",
    latitude: 5.56,
    longitude: -0.205
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showSlowLoadNotice = useSlowLoadNotice(isLoading || isSubmitting);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setIsLoading(true);
        setError(null);
        setRestaurants(await getRestaurants());
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load checkout data");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRestaurants();
  }, []);

  const restaurantById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])),
    [restaurants]
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<number, { restaurantName: string; deliveryFee: number; items: typeof items }>();

    for (const item of items) {
      const restaurant = restaurantById.get(item.restaurantId);
      const current = groups.get(item.restaurantId);
      const deliveryFee = restaurant?.estimatedDeliveryFee ?? 0;

      if (current) {
        current.items.push(item);
      } else {
        groups.set(item.restaurantId, {
          restaurantName: item.restaurantName,
          deliveryFee,
          items: [item]
        });
      }
    }

    return Array.from(groups.values());
  }, [items, restaurantById]);

  const deliveryFee = groupedItems.reduce((sum, group) => sum + group.deliveryFee, 0);
  const total = subtotal + deliveryFee;
  const deliveryPoint = {
    id: "delivery-point",
    label: "Delivery destination",
    address: deliveryLocation.address,
    latitude: deliveryLocation.latitude,
    longitude: deliveryLocation.longitude
  };

  const mappedRestaurants = useMemo(
    () =>
      groupedItems
        .map((group) => {
          const source = group.items[0] ? restaurantById.get(group.items[0].restaurantId) : undefined;
          if (!source) {
            return null;
          }

          return {
            id: String(source.id),
            label: source.name,
            address: source.address,
            latitude: source.latitude,
            longitude: source.longitude,
            distanceKm: source.distanceKm,
            estimatedDeliveryFee: source.estimatedDeliveryFee
          };
        })
        .filter((value): value is NonNullable<typeof value> => value !== null),
    [groupedItems, restaurantById]
  );

  async function handleSubmit() {
    if (!session) {
      return;
    }

    if (items.length === 0) {
      setError("Add at least one food item to your cart before checkout.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const batch = await placeGroupOrder(session.token, {
        deliveryAddress: deliveryLocation.address,
        deliveryLatitude: deliveryLocation.latitude,
        deliveryLongitude: deliveryLocation.longitude,
        customerEmail: session.email,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      });

      clearCart();

      if (batch.payment?.authorizationUrl) {
        window.location.assign(batch.payment.authorizationUrl);
        return;
      }

      router.push(`/orders/${batch.orders[0].id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to place combined order");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady || !isCartReady || isLoading) {
    return (
      <Shell>
        <div className="space-y-3">
          <p className="text-sm text-ink/70">Loading checkout...</p>
          {showSlowLoadNotice ? (
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
              This is taking longer than usual, but checkout is still loading.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (error && restaurants.length === 0) {
    return <Shell><ErrorMessage message={error} /></Shell>;
  }

  if (!session) {
    return (
      <Shell>
        <div className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Login required</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">
            Sign in as a customer before placing a real order. Your saved cart will stay here and be used for the combined checkout request.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent("/checkout")}`}
            className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
          >
            Login to continue
          </Link>
        </div>
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

    return (
      <Shell>
        <div className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Customer checkout only</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">
            Only accounts with the `USER` role can place orders. Your current role is {session.role}, so ordering is blocked by both the UI and backend.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={portalHref}
              className="inline-flex rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink"
            >
              Open your dashboard
            </Link>
            <Link
              href="/#marketplace"
              className="inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
            >
              Browse restaurants
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (items.length === 0) {
    return (
      <Shell>
        <div className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Your cart is empty</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">
            Go back to discover, browse foods from different restaurants, and add them to your cart. Then return here to complete a single combined checkout.
          </p>
          <Link
            href="/#marketplace"
            className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
          >
            Browse restaurants
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <section className="rounded-[32px] border border-white/50 bg-white/85 p-5 shadow-soft sm:p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-ink">Delivery details</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Customer name" value={session.fullName} readOnly />
              <Field label="Email address" value={session.email} readOnly />
              <div className="md:col-span-2">
                <LocationPicker
                  title="Drop-off location"
                  description="Search for the delivery address, use your current location, or click the map. The app keeps the exact coordinates behind the scenes for pricing and dispatch."
                  value={deliveryLocation}
                  onChange={setDeliveryLocation}
                  heightClassName="h-[340px]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-olive">Route planning</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Restaurants mapped against the drop-off point</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/65">
                Dashed lines show each restaurant leg feeding into this combined checkout while you refine the address with search or the map.
              </p>
            </div>
            <LocationMap restaurants={mappedRestaurants} deliveryPoint={deliveryPoint} />
          </section>

          <section className="rounded-[32px] bg-ink p-5 text-cream shadow-soft sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-cream/60">Your cart</p>
                <h2 className="mt-2 text-3xl font-semibold">{itemCount} item(s) from multiple restaurants</h2>
              </div>
              <Link href="/#marketplace" className="text-sm font-semibold text-citrus">
                Add more foods
              </Link>
            </div>

            <div className="mt-6 space-y-6">
              {groupedItems.map((group) => (
                <article key={group.restaurantName} className="rounded-[28px] bg-white/8 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-citrus">Restaurant</p>
                      <h3 className="mt-2 text-2xl font-semibold">{group.restaurantName}</h3>
                    </div>
                    <p className="text-sm text-cream/70">{formatCurrency(group.deliveryFee)} delivery</p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {group.items.map((item) => (
                      <div key={item.menuItemId} className="grid gap-4 rounded-3xl bg-white/8 p-4 md:grid-cols-[96px_1fr_auto] md:items-center">
                        <div className="relative h-24 overflow-hidden rounded-2xl bg-cream">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-cream" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold">{item.itemName}</h4>
                          <p className="mt-2 text-sm font-semibold">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.menuItemId, item.quantity - 1)}
                            className="h-10 w-10 rounded-full border border-white/15 text-lg"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.menuItemId, item.quantity + 1)}
                            className="h-10 w-10 rounded-full border border-white/15 text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="rounded-[32px] bg-ink p-5 text-cream shadow-soft sm:p-6 lg:p-8">
          <p className="text-sm uppercase tracking-[0.22em] text-cream/60">Combined order summary</p>
          <h2 className="mt-4 text-3xl font-semibold">Proceed to one checkout</h2>
          <div className="mt-6 space-y-6">
            {groupedItems.map((group) => (
              <div key={group.restaurantName} className="rounded-3xl bg-white/8 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="font-semibold">{group.restaurantName}</p>
                  <span className="text-sm text-cream/65">{formatCurrency(group.deliveryFee)} delivery</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  {group.items.map((item) => (
                    <div key={item.menuItemId} className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p>{item.itemName}</p>
                        <p className="text-cream/60">{item.quantity} item(s)</p>
                      </div>
                      <span>{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-cream/70">Food subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cream/70">Delivery</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {error ? <ErrorMessage message={error} dark /> : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || items.length === 0}
            className="mt-8 inline-flex w-full justify-center rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Placing combined order..." : "Place combined order"}
          </button>
          {isSubmitting && showSlowLoadNotice ? (
            <p className="mt-4 rounded-2xl bg-white/8 px-4 py-3 text-sm text-cream/75">
              This is taking longer than usual, but your order is still being submitted.
            </p>
          ) : null}
        </aside>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Checkout</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">Review the foods you added to your cart</h1>
      </div>
      {children}
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/70">{props.label}</span>
      <input
        readOnly={props.readOnly}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
        className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
      />
    </label>
  );
}

function ErrorMessage({ message, dark = false }: { message: string; dark?: boolean }) {
  return (
    <p className={`mt-6 rounded-2xl px-4 py-3 text-sm ${dark ? "bg-red-500/15 text-red-100" : "bg-red-500/10 text-red-700"}`}>
      {message}
    </p>
  );
}
