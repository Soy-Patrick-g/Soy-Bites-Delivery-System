"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { login } from "@/lib/api";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login: saveSession } = useAuth();
  const [email, setEmail] = useState("user@foodhub.dev");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } else if (session.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/checkout?restaurant=1");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[36px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-citrus">Login</p>
          <h1 className="mt-3 font-serif text-5xl">Sign in to use protected backend routes</h1>
          <p className="mt-5 text-sm leading-7 text-cream/72">
            Use the seeded accounts to test customer checkout or the admin analytics dashboard with a stored JWT.
          </p>

          <div className="mt-8 space-y-4 text-sm">
            <div className="rounded-3xl bg-white/8 p-4">
              <p className="font-semibold">Customer</p>
              <p className="mt-1 text-cream/70">user@foodhub.dev / Password123!</p>
            </div>
            <div className="rounded-3xl bg-white/8 p-4">
              <p className="font-semibold">Admin</p>
              <p className="mt-1 text-cream/70">admin@foodhub.dev / Password123!</p>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/50 bg-white/90 p-8 shadow-soft">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/70">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/70">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
              />
            </label>

            {error ? (
              <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-sm text-ink/68">
            <p>
              Public pages still work without login, but checkout and admin analytics now expect a saved JWT.
            </p>
            <Link href="/" className="mt-4 inline-flex font-semibold text-olive">
              Back to discover
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
