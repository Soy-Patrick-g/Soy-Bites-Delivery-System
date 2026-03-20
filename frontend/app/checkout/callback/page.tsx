"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/api";
import { Order } from "@/lib/types";

export default function CheckoutCallbackPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function confirmPayment() {
      if (!reference) {
        setError("No payment reference was provided by the checkout callback.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const verifiedOrder = await verifyPayment(reference);
        setOrder(verifiedOrder);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to verify payment");
      } finally {
        setIsLoading(false);
      }
    }

    void confirmPayment();
  }, [reference]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="rounded-[36px] bg-ink p-8 text-cream shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-citrus">Checkout callback</p>
        <h1 className="mt-3 font-serif text-5xl">Confirming your payment</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/70">
          We are checking the Paystack reference and syncing the latest order state from the backend before you print a receipt.
        </p>
      </div>

      <section className="mt-8 rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-soft">
        {isLoading ? (
          <p className="text-sm text-ink/70">Verifying payment...</p>
        ) : error ? (
          <>
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/checkout"
                className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white"
              >
                Return to checkout
              </Link>
            </div>
          </>
        ) : order ? (
          <>
            <div className="grid gap-5 md:grid-cols-[1fr_0.8fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-olive">Payment status</p>
                <h2 className="mt-2 text-3xl font-semibold text-ink">{order.paymentStatus}</h2>
                <p className="mt-4 text-sm leading-7 text-ink/68">
                  Your checkout is now linked to payment reference {order.paymentReference}. The first restaurant order in that checkout is order #{order.id} for {order.restaurantName}.
                </p>
              </div>
              <div className="rounded-3xl bg-cream p-5">
                <p className="text-sm text-ink/60">Checkout synced</p>
                <p className="mt-3 text-3xl font-semibold text-ink">{order.status}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/orders/${order.id}/receipt`}
                className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white"
              >
                Open printable receipt
              </Link>
              <Link
                href={`/orders/${order.id}`}
                className="rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink"
              >
                Track order
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
