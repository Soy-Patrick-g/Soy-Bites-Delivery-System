import axios from "axios";
import type {
  AuthSession,
  ForgotPasswordRequest,
  ForgotPasswordResult,
  LoginRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
  VerifyResetTokenRequest,
  VerifyResetTokenResult
} from "@/lib/types";

const DEFAULT_AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api";

function resolveAuthApiBaseUrl() {
  if (typeof window !== "undefined") {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    return configuredBaseUrl
      ? normalizeLoopbackApiBaseUrl(configuredBaseUrl, window.location.hostname)
      : `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }

  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  return DEFAULT_AUTH_API_BASE_URL;
}

const authApi = axios.create({
  baseURL: DEFAULT_AUTH_API_BASE_URL,
  withCredentials: true
});

authApi.interceptors.request.use((config) => ({
  ...config,
  baseURL: resolveAuthApiBaseUrl()
}));

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

function extractServerMessage(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  return null;
}

function toMessage(error: unknown, label: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = extractServerMessage(error.response?.data);

    if (!error.response) {
      return new Error("We couldn’t connect right now. Please check your connection and try again.");
    }

    if (status === 401) {
      return new Error("The email or password you entered is incorrect.");
    }

    if (status === 403) {
      return new Error(serverMessage ?? "This action is not available for your account.");
    }

    if (status === 404) {
      return new Error("That reset link is no longer available. Please request a new one.");
    }

    if (status === 429) {
      return new Error("Too many attempts were made. Please wait a moment and try again.");
    }

    if (status && status >= 500) {
      return new Error(serverMessage ?? `${label} is temporarily unavailable. Please try again soon.`);
    }

    return new Error(serverMessage ?? `${label} could not be completed. Please review your details and try again.`);
  }

  return error instanceof Error ? error : new Error(`${label} could not be completed right now.`);
}

export async function login(request: LoginRequest): Promise<AuthSession> {
  try {
    const { data } = await authApi.post<AuthSession>("/auth/login", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Sign-in");
  }
}

export async function registerUser(request: RegisterUserRequest): Promise<AuthSession> {
  try {
    const { data } = await authApi.post<AuthSession>("/auth/register", {
      fullName: request.fullName,
      email: request.email,
      password: request.password,
      confirmPassword: request.confirmPassword,
      profileImageUrl: request.profileImageUrl,
      role: "USER"
    });
    return data;
  } catch (error) {
    throw toMessage(error, "Account creation");
  }
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResult> {
  try {
    const { data } = await authApi.post<ForgotPasswordResult>("/auth/forgot-password", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Password reset");
  }
}

export async function resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
  try {
    const { data } = await authApi.post<{ message: string }>("/auth/reset-password", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Password reset");
  }
}

export async function verifyResetToken(request: VerifyResetTokenRequest): Promise<VerifyResetTokenResult> {
  try {
    const { data } = await authApi.post<VerifyResetTokenResult>("/auth/verify-reset-token", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Reset code verification");
  }
}
