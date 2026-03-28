import type { OrderStatus, PaymentStatus } from "@/lib/types";

const orderStatusLabels: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered"
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  INITIALIZED: "Awaiting payment",
  PAID: "Paid",
  FAILED: "Payment failed"
};

export function formatOrderStatus(status: OrderStatus) {
  return orderStatusLabels[status];
}

export function formatPaymentStatus(status: PaymentStatus) {
  return paymentStatusLabels[status];
}
