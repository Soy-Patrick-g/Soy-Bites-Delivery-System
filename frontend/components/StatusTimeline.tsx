import { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["RECEIVED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

const labels: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered"
};

export function StatusTimeline({ current }: { current: OrderStatus }) {
  const activeIndex = statuses.indexOf(current);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statuses.map((status, index) => {
        const active = index <= activeIndex;
        return (
          <div
            key={status}
            className={`rounded-3xl border p-4 ${active ? "border-ember bg-ember text-white" : "border-ink/10 bg-white text-ink/55"}`}
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]">
              Step {index + 1}
            </div>
            <div className="text-lg font-semibold">{labels[status]}</div>
          </div>
        );
      })}
    </div>
  );
}

