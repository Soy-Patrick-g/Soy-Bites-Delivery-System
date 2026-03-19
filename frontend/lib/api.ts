import axios from "axios";
import {
  AdminDashboard,
  AuthSession,
  LoginRequest,
  Order,
  PlaceOrderPayload,
  RestaurantDetail,
  RestaurantSummary
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api",
  timeout: 4000
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

export async function placeOrder(token: string, payload: PlaceOrderPayload): Promise<Order> {
  try {
    const { data } = await api.post<Order>("/orders", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Placing order");
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

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2
  }).format(amount);
}
