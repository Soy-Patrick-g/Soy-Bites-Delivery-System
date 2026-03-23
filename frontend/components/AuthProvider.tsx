"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logoutSession } from "@/lib/api";
import { AuthSession } from "@/lib/types";

const STORAGE_KEY = "foodhub.auth";
const COOKIE_KEY = "foodhub_token";

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthSession;
        const expiration = getSessionExpiration(parsed);
        if (expiration && expiration.getTime() <= Date.now()) {
          clearPersistedSession();
        } else {
          setSession(parsed);
          persistCookie(parsed.token);
        }
      } catch {
        clearPersistedSession();
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const expiration = getSessionExpiration(session);
    if (!expiration) {
      return;
    }

    const timeoutMs = expiration.getTime() - Date.now();
    if (timeoutMs <= 0) {
      void performLogout(session.token, true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void performLogout(session.token, true);
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [session]);

  async function performLogout(token?: string, redirectToLogin = false) {
    if (token) {
      try {
        await logoutSession(token);
      } catch {
        // Ignore logout transport errors and clear the local session anyway.
      }
    }

    setSession(null);
    clearPersistedSession();
    router.refresh();
    if (redirectToLogin) {
      router.push("/login");
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      login(nextSession) {
        setSession(nextSession);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        persistCookie(nextSession.token);
        router.refresh();
      },
      logout() {
        void performLogout(session?.token, true);
      }
    }),
    [isReady, router, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function getSessionExpiration(session: AuthSession) {
  if (session.expiresAt) {
    const explicitExpiration = new Date(session.expiresAt);
    if (!Number.isNaN(explicitExpiration.getTime())) {
      return explicitExpiration;
    }
  }

  try {
    const payload = session.token.split(".")[1];
    if (!payload) {
      return null;
    }
    const decoded = JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
}

function persistCookie(token: string) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

function clearPersistedSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
