import axios from "axios";
import type { AuthSession, ForgotPasswordRequest, ForgotPasswordResult, LoginRequest, ResetPasswordRequest } from "@/lib/types";

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api"
});

function toMessage(error: unknown, label: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (!error.response) {
      return new Error("We couldn’t connect right now. Please check your connection and try again.");
    }

    if (status === 401) {
      return new Error("The email or password you entered is incorrect.");
    }

    if (status === 403) {
      return new Error("This action is not available for your account.");
    }

    if (status === 404) {
      return new Error("That reset link is no longer available. Please request a new one.");
    }

    if (status === 429) {
      return new Error("Too many attempts were made. Please wait a moment and try again.");
    }

    if (status && status >= 500) {
      return new Error(`${label} is temporarily unavailable. Please try again soon.`);
    }

    return new Error(`${label} could not be completed. Please review your details and try again.`);
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
