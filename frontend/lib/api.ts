import axios from "axios";
import {
  AdminDashboard,
  AuthSession,
  DeliveryDashboard,
  DeliveryRegisterRequest,
  LoginRequest,
  OrderBatch,
  OwnerDashboard,
  Order,
  PlaceGroupOrderPayload,
  PlaceOrderPayload,
  RestaurantOwnerRegisterRequest,
  RestaurantDetail,
  RestaurantSummary
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api",
  timeout: 15000
});

function toMessage(error: unknown, label: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.message;
    return new Error(`${label} failed${status ? ` (${status})` : ""}: ${detail}`);
  }
  return error instanceof Error ? error : new Error(`${label} failed`);
}

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getRestaurants(): Promise<RestaurantSummary[]> {
  try {
    const { data } = await api.get<RestaurantSummary[]>("/restaurants", {
      params: { lat: 5.56, lng: -0.205 }
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading restaurants");
  }
}

export async function getRestaurant(id: string): Promise<RestaurantDetail> {
  try {
    const { data } = await api.get<RestaurantDetail>(`/restaurants/${id}`, {
      params: { lat: 5.56, lng: -0.205 }
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Loading restaurant ${id}`);
  }
}

export async function getOrder(id: string): Promise<Order> {
  try {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  } catch (error) {
    throw toMessage(error, `Loading order ${id}`);
  }
}

export async function getOrderBatch(id: string): Promise<OrderBatch> {
  try {
    const { data } = await api.get<OrderBatch>(`/orders/${id}/batch`);
    return data;
  } catch (error) {
    throw toMessage(error, `Loading combined receipt ${id}`);
  }
}

export async function getCurrentUserOrderHistory(token: string): Promise<Order[]> {
  try {
    const { data } = await api.get<Order[]>("/orders/history", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading order history");
  }
}

export async function getDashboard(token: string): Promise<AdminDashboard> {
  try {
    const { data } = await api.get<AdminDashboard>("/admin/dashboard", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading admin dashboard");
  }
}

export async function login(request: LoginRequest): Promise<AuthSession> {
  try {
    const { data } = await api.post<AuthSession>("/auth/login", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Login");
  }
}

export async function registerRestaurantOwner(request: RestaurantOwnerRegisterRequest): Promise<AuthSession> {
  try {
    const { data } = await api.post<AuthSession>("/owner/register", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant registration");
  }
}

export async function registerDeliveryPerson(request: DeliveryRegisterRequest): Promise<AuthSession> {
  try {
    const { data } = await api.post<AuthSession>("/delivery/register", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery registration");
  }
}

export async function placeOrder(token: string, payload: PlaceOrderPayload): Promise<Order> {
  try {
    const { data } = await api.post<Order>("/orders", payload, {
      headers: authHeaders(token),
      timeout: 20000
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Placing order");
  }
}

export async function placeGroupOrder(token: string, payload: PlaceGroupOrderPayload): Promise<OrderBatch> {
  try {
    const { data } = await api.post<OrderBatch>("/orders/batch", payload, {
      headers: authHeaders(token),
      timeout: 25000
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Placing combined order");
  }
}

export async function verifyPayment(reference: string): Promise<Order> {
  try {
    const { data } = await api.get<Order>("/orders/payment/verify", {
      params: { reference }
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Verifying payment");
  }
}

export async function getOwnerDashboard(token: string): Promise<OwnerDashboard> {
  try {
    const { data } = await api.get<OwnerDashboard>("/owner/dashboard", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading restaurant dashboard");
  }
}

export async function getDeliveryDashboard(token: string): Promise<DeliveryDashboard> {
  try {
    const { data } = await api.get<DeliveryDashboard>("/delivery/dashboard", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading delivery dashboard");
  }
}

export async function claimDeliveryOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/delivery/orders/${orderId}/claim`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Claiming delivery ${orderId}`);
  }
}

export async function completeDeliveryOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/delivery/orders/${orderId}/complete`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Completing delivery ${orderId}`);
  }
}

export async function advanceOwnerOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/owner/orders/${orderId}/advance`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Advancing order ${orderId}`);
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2
  }).format(amount);
}
