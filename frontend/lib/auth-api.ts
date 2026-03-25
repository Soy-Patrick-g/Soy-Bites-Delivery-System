import axios from "axios";
import type { AuthSession, ForgotPasswordRequest, ForgotPasswordResult, LoginRequest, ResetPasswordRequest } from "@/lib/types";

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api"
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

export async function login(request: LoginRequest): Promise<AuthSession> {
  try {
    const { data } = await authApi.post<AuthSession>("/auth/login", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Login");
  }
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResult> {
  try {
    const { data } = await authApi.post<ForgotPasswordResult>("/auth/forgot-password", request);
    return data;
  } catch (error) {
    throw toMessage(error, "Password reset request");
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
