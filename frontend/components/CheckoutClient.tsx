"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency, getRestaurant, placeOrder } from "@/lib/api";
import { RestaurantDetail } from "@/lib/types";

type QuantityMap = Record<number, number>;

export function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isReady, session } = useAuth();
  const restaurantId = searchParams.get("restaurant") ?? "1";
  const loginRedirect = `/checkout?restaurant=${restaurantId}`;
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [deliveryAddress, setDeliveryAddress] = useState("East Legon, Lagos Avenue 14");
  const [deliveryLatitude, setDeliveryLatitude] = useState("5.56");
  const [deliveryLongitude, setDeliveryLongitude] = useState("-0.205");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getRestaurant(restaurantId);
        setRestaurant(data);
        setQuantities(
          data.menu.reduce<QuantityMap>((accumulator, item, index) => {
            accumulator[item.id] = index === 0 ? 1 : 0;
            return accumulator;
          }, {})
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load checkout data");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRestaurant();
  }, [restaurantId]);

  const selectedItems = useMemo(
    () =>
      restaurant?.menu
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => ({
          ...item,
          quantity: quantities[item.id] ?? 0,
          lineTotal: item.price * (quantities[item.id] ?? 0)
        })) ?? [],
    [quantities, restaurant]
  );

  const subtotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = restaurant?.estimatedDeliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit() {
    if (!restaurant || !session) {
      return;
    }

    const items = selectedItems.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity
    }));

    if (items.length === 0) {
      setError("Select at least one menu item before placing the order.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const order = await placeOrder(session.token, {
        restaurantId: restaurant.id,
        deliveryAddress,
        deliveryLatitude: Number(deliveryLatitude),
        deliveryLongitude: Number(deliveryLongitude),
        customerEmail: session.email,
        items
      });

      if (order.payment?.authorizationUrl) {
        window.location.assign(order.payment.authorizationUrl);
        return;
      }

      router.push(`/orders/${order.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to place order");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !isReady) {
    return <Shell><p className="text-sm text-ink/70">Loading checkout...</p></Shell>;
  }

  if (error && !restaurant) {
    return <Shell><ErrorMessage message={error} /></Shell>;
  }

  if (!session) {
    return (
      <Shell>
        <div className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Login required</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">
            Sign in as a customer before placing a real order. Your JWT will be used for the protected `/api/orders` request.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(loginRedirect)}`}
            className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
          >
            Login to continue
          </Link>
        </div>
      </Shell>
    );
  }

  if (!restaurant) {
    return <Shell><ErrorMessage message="Restaurant not found." /></Shell>;
  }

  return (
    <Shell>
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[32px] border border-white/50 bg-white/85 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Delivery details</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Customer name" value={session.fullName} readOnly />
            <Field label="Email address" value={session.email} readOnly />
            <Field label="Delivery address" value={deliveryAddress} onChange={setDeliveryAddress} />
            <Field label="Latitude" value={deliveryLatitude} onChange={setDeliveryLatitude} />
            <Field label="Longitude" value={deliveryLongitude} onChange={setDeliveryLongitude} />
          </div>

          <div className="mt-8 rounded-[28px] bg-ink p-6 text-cream">
            <p className="text-sm uppercase tracking-[0.18em] text-cream/60">Choose menu items</p>
            <div className="mt-5 space-y-4">
              {restaurant.menu.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/8 px-5 py-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="mt-1 text-sm text-cream/70">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: Math.max(0, (current[item.id] ?? 0) - 1)
                        }))
                      }
                      className="h-10 w-10 rounded-full border border-white/15 text-lg"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantities[item.id] ?? 0}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: (current[item.id] ?? 0) + 1
                        }))
                      }
                      className="h-10 w-10 rounded-full border border-white/15 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[32px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-cream/60">Order summary</p>
          <h2 className="mt-4 text-3xl font-semibold">{restaurant.name}</h2>
          <div className="mt-6 space-y-4">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-cream/60">{item.quantity} item(s)</p>
                  </div>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-cream/60">No items selected yet.</p>
            )}
          </div>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-cream/70">Subtotal</span>
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
            disabled={isSubmitting || selectedItems.length === 0}
            className="mt-8 inline-flex w-full justify-center rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Placing order..." : "Place real order"}
          </button>
        </aside>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Checkout</p>
        <h1 className="mt-2 font-serif text-5xl text-ink">Secure payment simulation with Paystack-ready flow</h1>
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
