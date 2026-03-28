import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReceiptActions } from "@/components/ReceiptActions";
import { formatCurrency, getOrderBatch } from "@/lib/api";
import { formatOrderStatus, formatPaymentStatus } from "@/lib/order-display";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("foodhub_token")?.value;

  if (!token) {
    redirect(`/login?redirect=${encodeURIComponent(`/orders/${id}/receipt`)}`);
  }

  const batch = await getOrderBatch(id, token);
  const leadOrder = batch.orders[0];
  const createdAt = batch.orders
    .map((order) => new Date(order.createdAt).getTime())
    .reduce((earliest, value) => Math.min(earliest, value), Number.POSITIVE_INFINITY);
  const paymentReference = batch.payment?.reference ?? leadOrder.paymentReference;
  const paymentStatus = batch.orders.some((order) => order.paymentStatus === "PAID")
    ? "PAID"
    : batch.orders[0].paymentStatus;

  return (
    <main className="min-h-screen bg-cream pb-16">
      <ReceiptActions
        orderId={leadOrder.id}
        title={`Checkout ${batch.groupReference}`}
        backHref={`/orders/${leadOrder.id}`}
      />

      <div className="mx-auto max-w-5xl px-6">
        <section className="rounded-[36px] border border-ink/10 bg-white px-8 py-10 shadow-soft print:rounded-none print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/10 pb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">FoodHub receipt</p>
              <h2 className="mt-3 font-serif text-4xl text-ink">Combined checkout</h2>
              <p className="mt-3 text-sm text-ink/68">{batch.groupReference}</p>
              <p className="mt-2 text-sm text-ink/60">{batch.orders.length} restaurant orders grouped into one payment.</p>
            </div>
            <div className="rounded-[28px] bg-ink px-6 py-5 text-cream">
              <p className="text-sm text-cream/60">Payment</p>
              <p className="mt-2 text-xl font-semibold">{formatPaymentStatus(paymentStatus)}</p>
              <p className="mt-2 text-sm text-cream/65">{paymentReference}</p>
            </div>
          </div>

          <div className="grid gap-8 border-b border-ink/10 py-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Delivered to</p>
              <p className="mt-3 text-lg font-semibold text-ink">{leadOrder.customerName}</p>
              <p className="mt-2 text-sm leading-6 text-ink/70">{leadOrder.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Receipt details</p>
              <dl className="mt-3 space-y-2 text-sm text-ink/72">
                <div className="flex justify-between gap-4">
                  <dt>Created</dt>
                  <dd>{new Date(createdAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Orders covered</dt>
                  <dd>{batch.orders.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Combined delivery</dt>
                  <dd>{formatCurrency(batch.deliveryFee)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-8 py-8">
            {batch.orders.map((order) => (
              <section key={order.id} className="rounded-[30px] border border-ink/10 bg-cream/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-5 border-b border-ink/10 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-olive">Restaurant order #{order.id}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-ink">{order.restaurantName}</h3>
                    <p className="mt-2 text-sm text-ink/65">
                      Status {formatOrderStatus(order.status)} • Payment {formatPaymentStatus(order.paymentStatus)}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white px-5 py-4 text-sm text-ink shadow-soft">
                    <p className="font-semibold">Owner allocation</p>
                    <p className="mt-2 text-xl font-semibold">{formatCurrency(order.ownerAllocation)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink/50">Food subtotal for this restaurant</p>
                  </div>
                </div>

                <div className="mt-6">
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

                <div className="mt-6 ml-auto max-w-sm border-t border-ink/10 pt-5">
                  <div className="space-y-3 text-sm text-ink/72">
                    <div className="flex justify-between">
                      <span>Food subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery share</span>
                      <span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-ink">
                      <span>Restaurant order total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="ml-auto max-w-sm border-t border-ink/10 pt-6">
            <div className="space-y-3 text-sm text-ink/72">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(batch.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>{formatCurrency(batch.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-ink">
                <span>Total paid</span>
                <span>{formatCurrency(batch.total)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
