import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import {
  Coordinates,
  AdminAuditLog,
  AdminDashboard,
  AdminDeliveryCommission,
  AdminDeliverySettings,
  AdminRestaurant,
  AdminSessionRecord,
  AdminTransaction,
  AdminTransactionFilters,
  AdminUserInsight,
  AdminWithdrawal,
  AccountProfile,
  AuthSession,
  CreateWithdrawalRequest,
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
  UpdateAccountProfileRequest,
  UploadedImage,
  WithdrawalBankOption,
  WithdrawalDashboard,
  WithdrawalRecord,
  UpdateDeliveryCommissionStatusRequest,
  UpdateDeliverySettingsRequest,
  UpdateOwnerMenuItemRequest
} from "@/lib/types";

const AUTH_STORAGE_KEY = "foodhub.auth";
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api";

function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const preferredBaseUrl = configuredBaseUrl
      ? normalizeLoopbackApiBaseUrl(configuredBaseUrl, window.location.hostname)
      : `${window.location.protocol}//${window.location.hostname}:8080/api`;

    return preferredBaseUrl;
  }

  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
}

const api = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = resolveApiBaseUrl();
  config.headers = withPersistedAuthHeader(config.headers);
  return config;
});

function withPersistedAuthHeader(headers?: InternalAxiosRequestConfig["headers"]) {
  const nextHeaders = headers instanceof AxiosHeaders ? headers : new AxiosHeaders(headers);

  if (!nextHeaders.has("Authorization")) {
    const persistedToken = getPersistedAuthToken();
    if (persistedToken) {
      nextHeaders.set("Authorization", `Bearer ${persistedToken}`);
    }
  }

  return nextHeaders;
}

function getPersistedAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as Partial<AuthSession>;
    return typeof parsed.token === "string" && parsed.token.trim() ? parsed.token : null;
  } catch {
    return null;
  }
}

function normalizeLoopbackApiBaseUrl(baseUrl: string, browserHostname: string) {
  try {
    const parsed = new URL(baseUrl);
    const hostnames = new Set(["localhost", "127.0.0.1"]);
    if (hostnames.has(parsed.hostname) && hostnames.has(browserHostname) && parsed.hostname !== browserHostname) {
      parsed.hostname = browserHostname;
      return parsed.toString().replace(/\/$/, "");
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return baseUrl;
  }
}

function cleanParams(params: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));
}

function extractApiMessage(data: unknown): string | null {
  if (!data) {
    return null;
  }

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (typeof data === "object") {
    const payload = data as Record<string, unknown>;
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const detail = typeof payload.detail === "string" ? payload.detail.trim() : "";
    const errorText = typeof payload.error === "string" ? payload.error.trim() : "";
    return message || detail || errorText || null;
  }

  return null;
}

function toMessage(error: unknown, label: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage = extractApiMessage(error.response?.data);

    if (!error.response) {
      return new Error("We couldn’t connect right now. Please check your connection and try again.");
    }

    if (status === 401) {
      return new Error(backendMessage || "Your session has ended. Please sign in again and try once more.");
    }

    if (status === 403) {
      return new Error(backendMessage || "You do not have permission to do that.");
    }

    if (status === 404) {
      return new Error(backendMessage || `${label} could not be found. Please refresh and try again.`);
    }

    if (status === 409) {
      return new Error(backendMessage || "This request could not be completed because the information changed. Please refresh and try again.");
    }

    if (status === 422) {
      return new Error(backendMessage || "Some of the information provided needs attention. Please review it and try again.");
    }

    if (status === 429) {
      return new Error(backendMessage || "Too many requests were made. Please wait a moment and try again.");
    }

    if (typeof status === "number" && status >= 500) {
      return new Error(backendMessage || `${label} is temporarily unavailable. Please try again soon.`);
    }

    return new Error(backendMessage || `${label} could not be completed right now. Please try again.`);
  }
  return error instanceof Error ? error : new Error(`${label} could not be completed right now.`);
}

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function proximityParams(location?: Coordinates) {
  if (!location) {
    return undefined;
  }

  return {
    lat: location.latitude,
    lng: location.longitude
  };
}

export async function getRestaurants(location?: Coordinates): Promise<RestaurantSummary[]> {
  try {
    const { data } = await api.get<RestaurantSummary[]>("/restaurants", {
      params: proximityParams(location)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant information");
  }
}

export async function getRestaurant(id: string, location?: Coordinates): Promise<RestaurantDetail> {
  try {
    const { data } = await api.get<RestaurantDetail>(`/restaurants/${id}`, {
      params: proximityParams(location)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant information");
  }
}

export async function getOrder(id: string, token?: string): Promise<Order> {
  try {
    const { data } = await api.get<Order>(`/orders/${id}`, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Order details");
  }
}

export async function getOrderBatch(id: string, token?: string): Promise<OrderBatch> {
  try {
    const { data } = await api.get<OrderBatch>(`/orders/${id}/batch`, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Receipt details");
  }
}

export async function getCurrentUserOrderHistory(token: string): Promise<Order[]> {
  try {
    const { data } = await api.get<Order[]>("/orders/history", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Order history");
  }
}

export async function getDashboard(token: string): Promise<AdminDashboard> {
  try {
    const { data } = await api.get<AdminDashboard>("/admin/dashboard", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Admin dashboard");
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
    throw toMessage(error, "Transaction history");
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
    throw toMessage(error, "Transaction export");
  }
}

export async function getAdminAuditLogs(token: string): Promise<AdminAuditLog[]> {
  try {
    const { data } = await api.get<AdminAuditLog[]>("/admin/audit-logs", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Activity history");
  }
}

export async function getAdminSessions(token: string): Promise<AdminSessionRecord[]> {
  try {
    const { data } = await api.get<AdminSessionRecord[]>("/admin/sessions", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Session details");
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
    throw toMessage(error, "Account details");
  }
}

export async function getAdminDeliveryCommissions(token: string): Promise<AdminDeliveryCommission[]> {
  try {
    const { data } = await api.get<AdminDeliveryCommission[]>("/admin/delivery-commissions", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Commission records");
  }
}

export async function updateAdminDeliveryCommissionStatus(
  token: string,
  commissionId: number,
  payload: UpdateDeliveryCommissionStatusRequest
): Promise<AdminDeliveryCommission> {
  try {
    const { data } = await api.patch<AdminDeliveryCommission>(`/admin/delivery-commissions/${commissionId}/status`, payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Commission payment update");
  }
}

export async function getAdminWithdrawals(token: string): Promise<AdminWithdrawal[]> {
  try {
    const { data } = await api.get<AdminWithdrawal[]>("/admin/withdrawals", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Withdrawal requests");
  }
}

export async function approveAdminWithdrawal(token: string, withdrawalId: number): Promise<AdminWithdrawal> {
  try {
    const { data } = await api.patch<AdminWithdrawal>(`/admin/withdrawals/${withdrawalId}/approve`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Withdrawal approval");
  }
}

export async function rejectAdminWithdrawal(token: string, withdrawalId: number, reason?: string): Promise<AdminWithdrawal> {
  try {
    const { data } = await api.patch<AdminWithdrawal>(
      `/admin/withdrawals/${withdrawalId}/reject`,
      reason ? { reason } : {},
      { headers: authHeaders(token) }
    );
    return data;
  } catch (error) {
    throw toMessage(error, "Withdrawal rejection");
  }
}

export async function payAdminWithdrawal(token: string, withdrawalId: number): Promise<AdminWithdrawal> {
  try {
    const { data } = await api.patch<AdminWithdrawal>(`/admin/withdrawals/${withdrawalId}/pay`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Withdrawal payout");
  }
}

export async function getAdminDeliverySettings(token: string): Promise<AdminDeliverySettings> {
  try {
    const { data } = await api.get<AdminDeliverySettings>("/admin/settings/delivery", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery settings");
  }
}

export async function updateAdminDeliverySettings(
  token: string,
  payload: UpdateDeliverySettingsRequest
): Promise<AdminDeliverySettings> {
  try {
    const { data } = await api.patch<AdminDeliverySettings>("/admin/settings/delivery", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery settings");
  }
}

export async function updateAdminUserStatus(token: string, userId: number, active: boolean): Promise<AdminUserInsight> {
  try {
    const { data } = await api.patch<AdminUserInsight>(`/admin/users/${userId}/status`, { active }, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Account update");
  }
}

export async function deleteAdminUser(token: string, userId: number): Promise<void> {
  try {
    await api.delete(`/admin/users/${userId}`, {
      headers: authHeaders(token)
    });
  } catch (error) {
    throw toMessage(error, "Account removal");
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
    throw toMessage(error, "Restaurant list");
  }
}

export async function updateAdminRestaurantVerification(token: string, restaurantId: number, verified: boolean): Promise<AdminRestaurant> {
  try {
    const { data } = await api.patch<AdminRestaurant>(`/admin/restaurants/${restaurantId}/verification`, { verified }, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant verification");
  }
}

export async function updateAdminRestaurantStatus(token: string, restaurantId: number, active: boolean): Promise<AdminRestaurant> {
  try {
    const { data } = await api.patch<AdminRestaurant>(`/admin/restaurants/${restaurantId}/status`, { active }, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant update");
  }
}

export async function login(request: LoginRequest): Promise<AuthSession> {
  try {
    const { data } = await api.post<AuthSession>("/auth/login", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Sign-in");
  }
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResult> {
  try {
    const { data } = await api.post<ForgotPasswordResult>("/auth/forgot-password", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Password reset");
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
    throw toMessage(error, "Sign-out");
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
    throw toMessage(error, "Rider registration");
  }
}

export async function uploadProfileImage(file: File): Promise<UploadedImage> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post<UploadedImage>("/uploads/profile-images", formData);
    return data;
  } catch (error) {
    throw toMessage(error, "Profile image upload");
  }
}

export async function getAccountProfile(token: string): Promise<AccountProfile> {
  try {
    const { data } = await api.get<AccountProfile>("/account/profile", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Account details");
  }
}

export async function updateAccountProfile(
  token: string,
  payload: UpdateAccountProfileRequest
): Promise<AccountProfile> {
  try {
    const { data } = await api.patch<AccountProfile>("/account/profile", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Account update");
  }
}

export async function addRestaurantReview(token: string, payload: ReviewRequest): Promise<Review> {
  try {
    const { data } = await api.post<Review>("/restaurants/reviews", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Review submission");
  }
}

export async function placeOrder(token: string, payload: PlaceOrderPayload): Promise<Order> {
  try {
    const { data } = await api.post<Order>("/orders", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Order placement");
  }
}

export async function placeGroupOrder(token: string, payload: PlaceGroupOrderPayload): Promise<OrderBatch> {
  try {
    const { data } = await api.post<OrderBatch>("/orders/batch", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Order placement");
  }
}

export async function verifyPayment(reference: string): Promise<Order> {
  try {
    const { data } = await api.get<Order>("/orders/payment/verify", {
      params: { reference }
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Payment verification");
  }
}

export async function getOwnerDashboard(token: string): Promise<OwnerDashboard> {
  try {
    const { data } = await api.get<OwnerDashboard>("/owner/dashboard", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant dashboard");
  }
}

export async function getOwnerRestaurantMenu(token: string, restaurantId: number): Promise<MenuItem[]> {
  try {
    const { data } = await api.get<MenuItem[]>(`/owner/restaurants/${restaurantId}/menu`, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Menu details");
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
    throw toMessage(error, "Menu update");
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
    throw toMessage(error, "Menu update");
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
    throw toMessage(error, "Menu availability update");
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
    throw toMessage(error, "Branch creation");
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
    throw toMessage(error, "Image upload");
  }
}

export async function getDeliveryDashboard(token: string): Promise<DeliveryDashboard> {
  try {
    const { data } = await api.get<DeliveryDashboard>("/delivery/dashboard", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery dashboard");
  }
}

export async function updateDeliveryLocation(token: string, location: DeliveryLocation): Promise<DeliveryLocation> {
  try {
    const { data } = await api.patch<DeliveryLocation>("/delivery/location", location, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Location update");
  }
}

export async function claimDeliveryOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/delivery/orders/${orderId}/claim`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Route claim");
  }
}

export async function unclaimDeliveryOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/delivery/orders/${orderId}/unclaim`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Route release");
  }
}

export async function completeDeliveryOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/delivery/orders/${orderId}/complete`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery completion");
  }
}

export async function getDeliveryWithdrawals(token: string): Promise<WithdrawalDashboard> {
  try {
    const { data } = await api.get<WithdrawalDashboard>("/delivery/withdrawals", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery withdrawals");
  }
}

export async function getDeliveryWithdrawalBanks(token: string): Promise<WithdrawalBankOption[]> {
  try {
    const { data } = await api.get<WithdrawalBankOption[]>("/delivery/withdrawals/banks", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Supported payout destinations");
  }
}

export async function createDeliveryWithdrawal(token: string, payload: CreateWithdrawalRequest): Promise<WithdrawalRecord> {
  try {
    const { data } = await api.post<WithdrawalRecord>("/withdrawal-requests/delivery", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Delivery withdrawal");
  }
}

export async function advanceOwnerOrder(token: string, orderId: number): Promise<Order> {
  try {
    const { data } = await api.patch<Order>(`/owner/orders/${orderId}/advance`, undefined, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Order update");
  }
}

export async function getOwnerWithdrawals(token: string): Promise<WithdrawalDashboard> {
  try {
    const { data } = await api.get<WithdrawalDashboard>("/owner/withdrawals", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant withdrawals");
  }
}

export async function getOwnerWithdrawalBanks(token: string): Promise<WithdrawalBankOption[]> {
  try {
    const { data } = await api.get<WithdrawalBankOption[]>("/owner/withdrawals/banks", {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Supported payout destinations");
  }
}

export async function createOwnerWithdrawal(token: string, payload: CreateWithdrawalRequest): Promise<WithdrawalRecord> {
  try {
    const { data } = await api.post<WithdrawalRecord>("/withdrawal-requests/owner", payload, {
      headers: authHeaders(token)
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Restaurant withdrawal");
  }
}

export function formatCurrency(amount: number) {
  return `gh₵${new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)}`;
}
