import axios from "axios";
import {
  AdminAuditLog,
  AdminDashboard,
  AdminRestaurant,
  AdminSessionRecord,
  AdminTransaction,
  AdminTransactionFilters,
  AdminUserInsight,
  AuthSession,
  CreateRestaurantBranchRequest,
  DeliveryLocation,
  CreateOwnerMenuItemRequest,
  DeliveryDashboard,
  DeliveryRegisterRequest,
  ForgotPasswordRequest,
  ForgotPasswordResult,
  LoginRequest,
  MenuItem,
  OrderBatch,
  OwnerDashboard,
  Order,
  Review,
  ReviewRequest,
  PlaceGroupOrderPayload,
  PlaceOrderPayload,
  RestaurantOwnerRegisterRequest,
  RestaurantDetail,
  RestaurantSummary,
  ResetPasswordRequest,
  UploadedImage,
  UpdateOwnerMenuItemRequest
} from "@/lib/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api"
});

function cleanParams(params: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));
}

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

export async function getOrder(id: string, token?: string): Promise<Order> {
  try {
    const { data } = await api.get<Order>(`/orders/${id}`, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Loading order ${id}`);
  }
}

export async function getOrderBatch(id: string, token?: string): Promise<OrderBatch> {
  try {
    const { data } = await api.get<OrderBatch>(`/orders/${id}/batch`, {
      headers: authHeaders(token)
    });
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

export async function getAdminTransactions(token: string, filters: AdminTransactionFilters): Promise<AdminTransaction[]> {
  try {
    const { data } = await api.get<AdminTransaction[]>("/admin/transactions", {
      headers: authHeaders(token),
      params: cleanParams(filters)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading transactions");
  }
}

export async function exportAdminTransactionsCsv(token: string, filters: AdminTransactionFilters): Promise<Blob> {
  try {
    const { data } = await api.get("/admin/transactions/export", {
      headers: authHeaders(token),
      params: cleanParams(filters),
      responseType: "blob"
    });
    return data as Blob;
  } catch (error) {
    throw toMessage(error, "Exporting transactions CSV");
  }
}

export async function getAdminAuditLogs(token: string): Promise<AdminAuditLog[]> {
  try {
    const { data } = await api.get<AdminAuditLog[]>("/admin/audit-logs", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading audit logs");
  }
}

export async function getAdminSessions(token: string): Promise<AdminSessionRecord[]> {
  try {
    const { data } = await api.get<AdminSessionRecord[]>("/admin/sessions", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading sessions");
  }
}

export async function getAdminUsers(token: string, search?: string): Promise<AdminUserInsight[]> {
  try {
    const { data } = await api.get<AdminUserInsight[]>("/admin/users", {
      headers: authHeaders(token),
      params: cleanParams({ search })
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading user insights");
  }
}

export async function updateAdminUserStatus(token: string, userId: number, active: boolean): Promise<AdminUserInsight> {
  try {
    const { data } = await api.patch<AdminUserInsight>(`/admin/users/${userId}/status`, { active }, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Updating user ${userId}`);
  }
}

export async function deleteAdminUser(token: string, userId: number): Promise<void> {
  try {
    await api.delete(`/admin/users/${userId}`, {
      headers: authHeaders(token)
    });
  } catch (error) {
    throw toMessage(error, `Deleting user ${userId}`);
  }
}

export async function getAdminRestaurants(token: string, search?: string): Promise<AdminRestaurant[]> {
  try {
    const { data } = await api.get<AdminRestaurant[]>("/admin/restaurants", {
      headers: authHeaders(token),
      params: cleanParams({ search })
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Loading restaurants");
  }
}

export async function updateAdminRestaurantVerification(token: string, restaurantId: number, verified: boolean): Promise<AdminRestaurant> {
  try {
    const { data } = await api.patch<AdminRestaurant>(`/admin/restaurants/${restaurantId}/verification`, { verified }, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Updating restaurant ${restaurantId} verification`);
  }
}

export async function updateAdminRestaurantStatus(token: string, restaurantId: number, active: boolean): Promise<AdminRestaurant> {
  try {
    const { data } = await api.patch<AdminRestaurant>(`/admin/restaurants/${restaurantId}/status`, { active }, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Updating restaurant ${restaurantId} status`);
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

export async function forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResult> {
  try {
    const { data } = await api.post<ForgotPasswordResult>("/auth/forgot-password", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Password reset request");
  }
}

export async function resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
  try {
    const { data } = await api.post<{ message: string }>("/auth/reset-password", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Password reset");
  }
}

export async function logoutSession(token: string): Promise<void> {
  try {
    await api.post("/auth/logout", undefined, {
      headers: authHeaders(token)
    });
  } catch (error) {
    throw toMessage(error, "Logout");
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

export async function addRestaurantReview(token: string, payload: ReviewRequest): Promise<Review> {
  try {
    const { data } = await api.post<Review>("/restaurants/reviews", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Submitting review");
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

export async function placeGroupOrder(token: string, payload: PlaceGroupOrderPayload): Promise<OrderBatch> {
  try {
    const { data } = await api.post<OrderBatch>("/orders/batch", payload, {
      headers: authHeaders(token)
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

export async function getOwnerRestaurantMenu(token: string, restaurantId: number): Promise<MenuItem[]> {
  try {
    const { data } = await api.get<MenuItem[]>(`/owner/restaurants/${restaurantId}/menu`, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Loading restaurant menu ${restaurantId}`);
  }
}

export async function createOwnerMenuItem(
  token: string,
  restaurantId: number,
  payload: CreateOwnerMenuItemRequest
): Promise<MenuItem> {
  try {
    const { data } = await api.post<MenuItem>(`/owner/restaurants/${restaurantId}/menu`, payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Creating menu item");
  }
}

export async function updateOwnerMenuItem(
  token: string,
  restaurantId: number,
  menuItemId: number,
  payload: UpdateOwnerMenuItemRequest
): Promise<MenuItem> {
  try {
    const { data } = await api.patch<MenuItem>(`/owner/restaurants/${restaurantId}/menu/${menuItemId}`, payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Updating menu item ${menuItemId}`);
  }
}

export async function setOwnerMenuItemAvailability(
  token: string,
  restaurantId: number,
  menuItemId: number,
  available: boolean
): Promise<MenuItem> {
  try {
    const { data } = await api.patch<MenuItem>(
      `/owner/restaurants/${restaurantId}/menu/${menuItemId}/availability`,
      { available },
      { headers: authHeaders(token) }
    );
    return data;
  } catch (error) {
    throw toMessage(error, `Updating menu availability ${menuItemId}`);
  }
}

export async function createOwnerBranch(
  token: string,
  payload: CreateRestaurantBranchRequest
): Promise<RestaurantSummary> {
  try {
    const { data } = await api.post<RestaurantSummary>("/owner/branches", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Creating branch");
  }
}

export async function uploadOwnerImage(token: string, file: File): Promise<UploadedImage> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<UploadedImage>("/owner/uploads/images", formData, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Uploading image");
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

export async function updateDeliveryLocation(token: string, location: DeliveryLocation): Promise<DeliveryLocation> {
  try {
    const { data } = await api.patch<DeliveryLocation>("/delivery/location", location, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Updating live rider location");
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

export async function unclaimDeliveryOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/delivery/orders/${orderId}/unclaim`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, `Unclaiming delivery ${orderId}`);
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
  return `gh₵${new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)}`;
}
