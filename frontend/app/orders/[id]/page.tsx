import Link from "next/link";
import { StatusTimeline } from "@/components/StatusTimeline";
import { formatCurrency, getOrder } from "@/lib/api";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-[36px] bg-ink p-8 text-cream shadow-soft">
        <p className="text-sm uppercase tracking-[0.22em] text-cream/60">Order tracking</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold">Order #{order.id}</h1>
            <p className="mt-3 text-cream/70">
              {order.restaurantName} to {order.deliveryAddress}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-3xl bg-white/8 px-5 py-4">
              <p className="text-sm text-cream/60">Payment reference</p>
              <p className="mt-2 font-medium">{order.paymentReference}</p>
            </div>
            <Link
              href={`/orders/${order.id}/receipt`}
              className="inline-flex items-center rounded-full bg-citrus px-5 py-3 text-sm font-semibold text-ink"
            >
              Printable receipt
            </Link>
            {order.payment?.authorizationUrl && order.paymentStatus !== "PAID" ? (
              <Link
                href={order.payment.authorizationUrl}
                className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
              >
                {order.payment.simulated ? "Open demo checkout" : "Continue to Paystack"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <StatusTimeline current={order.status} />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[32px] border border-white/50 bg-white/90 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Items in this order</h2>
          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-cream px-5 py-4">
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-sm text-ink/65">Qty {item.quantity}</p>
                </div>
                <span className="font-semibold text-ink">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Order totals</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/65">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/65">Delivery</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-cream px-4 py-4 text-sm text-ink/70">
            <p className="font-semibold text-ink">Delivery rider</p>
            <p className="mt-2">
              {order.deliveryPersonName
                ? `${order.deliveryPersonName}${order.deliveryPersonEmail ? ` (${order.deliveryPersonEmail})` : ""}`
                : "A rider will appear here once the order has been claimed for delivery."}
            </p>
          </div>
          <p className="mt-6 rounded-2xl bg-olive/10 px-4 py-3 text-sm text-olive">
            Status updates can be pushed in real time later using WebSockets without changing the timeline component structure.
          </p>
        </aside>
      </section>
    </main>
  );
}
