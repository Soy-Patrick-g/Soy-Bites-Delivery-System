import { ReceiptActions } from "@/components/ReceiptActions";
import { formatCurrency, getOrder } from "@/lib/api";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <main className="min-h-screen bg-cream pb-16">
      <ReceiptActions orderId={order.id} />

      <div className="mx-auto max-w-5xl px-6">
        <section className="rounded-[36px] border border-ink/10 bg-white px-8 py-10 shadow-soft print:rounded-none print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/10 pb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">FoodHub receipt</p>
              <h2 className="mt-3 font-serif text-4xl text-ink">Order #{order.id}</h2>
              <p className="mt-3 text-sm text-ink/68">{order.restaurantName}</p>
            </div>
            <div className="rounded-[28px] bg-ink px-6 py-5 text-cream">
              <p className="text-sm text-cream/60">Payment</p>
              <p className="mt-2 text-xl font-semibold">{order.paymentStatus}</p>
              <p className="mt-2 text-sm text-cream/65">{order.paymentReference}</p>
            </div>
          </div>

          <div className="grid gap-8 border-b border-ink/10 py-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Delivered to</p>
              <p className="mt-3 text-lg font-semibold text-ink">{order.customerName}</p>
              <p className="mt-2 text-sm leading-6 text-ink/70">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Receipt details</p>
              <dl className="mt-3 space-y-2 text-sm text-ink/72">
                <div className="flex justify-between gap-4">
                  <dt>Created</dt>
                  <dd>{new Date(order.createdAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Order status</dt>
                  <dd>{order.status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Distance</dt>
                  <dd>{order.distanceKm.toFixed(1)} km</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="py-8">
            <div className="grid grid-cols-[1.5fr_0.6fr_0.8fr] gap-4 border-b border-ink/10 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">
              <span>Item</span>
              <span>Qty</span>
              <span className="text-right">Total</span>
            </div>

            <div className="space-y-4 pt-5">
              {order.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.5fr_0.6fr_0.8fr] gap-4 text-sm text-ink">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-ink/55">{formatCurrency(item.unitPrice)} each</p>
                  </div>
                  <span>{item.quantity}</span>
                  <span className="text-right font-semibold">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-auto max-w-sm border-t border-ink/10 pt-6">
            <div className="space-y-3 text-sm text-ink/72">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-ink">
                <span>Total paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
