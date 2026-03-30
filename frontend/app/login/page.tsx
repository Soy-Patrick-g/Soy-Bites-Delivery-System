"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PasswordField } from "@/components/PasswordField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { login } from "@/lib/auth-api";
import { APP_NAME } from "@/lib/brand";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login: saveSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function defaultRouteForRole(role: string) {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "RESTAURANT":
        return "/restaurant/dashboard";
      case "DELIVERY":
        return "/delivery/dashboard";
      case "USER":
      default:
        return "/";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      const session = await login({ email, password });
      saveSession(session);

      const redirect = searchParams.get("redirect");
      if (redirect?.startsWith("/")) {
        router.push(redirect);
      } else {
        router.push(defaultRouteForRole(session.role));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Login"
      title={`Welcome back to ${APP_NAME}`}
      description={`Sign in to place orders, track deliveries, or manage your ${APP_NAME} account.`}
      leftContent={
        <>
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
            <p className="font-semibold uppercase tracking-[0.18em] text-citrus">Order with confidence</p>
            <p className="mt-3 leading-7 text-cream/72">
              Access your saved details, continue to checkout, and follow every order from confirmation to delivery.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
            <p className="font-semibold uppercase tracking-[0.18em] text-citrus">Want to sell on {APP_NAME}?</p>
            <p className="mt-3 leading-7 text-cream/72">
              Create your restaurant account, register your location, and start receiving customer orders.
            </p>
            <Link href="/restaurant/register" className="mt-4 inline-flex font-semibold text-citrus">
              Register restaurant
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
            <p className="font-semibold uppercase tracking-[0.18em] text-citrus">Want to deliver orders?</p>
            <p className="mt-3 leading-7 text-cream/72">
              Join the delivery network, claim available routes, and keep customers updated while you are on the road.
            </p>
            <Link href="/delivery/register" className="mt-4 inline-flex font-semibold text-citrus">
              Register as rider
            </Link>
          </div>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/70">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
                required
              />
            </label>

            <PasswordField label="Password" value={password} onChange={setPassword} />

            <div className="-mt-1 flex justify-end">
              <Link href="/forgot-password" className="text-sm font-semibold text-olive">
                Forgot password?
              </Link>
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action w-full justify-center disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
      </form>

      <div className="mt-6 text-sm text-ink/68">
        <p>Need an account? Choose the option that matches how you use {APP_NAME}.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/register" className="inline-flex font-semibold text-olive">
            Create customer account
          </Link>
          <Link href="/" className="inline-flex font-semibold text-olive">
            Back to discover
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
