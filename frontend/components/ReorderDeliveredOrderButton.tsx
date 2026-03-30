"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import type { Order } from "@/lib/types";

export function ReorderDeliveredOrderButton({ order }: { order: Order }) {
  const router = useRouter();
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        order.items.forEach((item) => {
          addItem({
            menuItemId: item.menuItemId,
            restaurantId: order.restaurantId,
            restaurantName: order.restaurantName,
            itemName: item.name,
            price: item.unitPrice,
            quantity: item.quantity
          });
        });
        router.push("/checkout");
      }}
      className="rounded-full bg-citrus px-5 py-3 text-sm font-semibold text-ink transition hover:bg-citrus/90"
    >
      Reorder this meal
    </button>
  );
}
