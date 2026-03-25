"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await forgotPassword({ email });
      setSuccessMessage(result.message);
      setPreviewResetUrl(result.previewResetUrl ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to prepare a password reset link");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[36px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-citrus">Forgot Password</p>
          <h1 className="mt-3 font-serif text-5xl">Reset access without creating a new account</h1>
          <p className="mt-5 text-sm leading-7 text-cream/72">
            Enter the email address tied to your FoodHub account and we&apos;ll prepare a password reset link.
          </p>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
            <p className="font-semibold uppercase tracking-[0.18em] text-citrus">How it works</p>
            <p className="mt-3 leading-7 text-cream/72">
              This project currently exposes a reset link preview in local development so you can finish the flow even before email delivery is connected.
            </p>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/50 bg-white/90 p-8 shadow-soft">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/70">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
                placeholder="you@example.com"
                required
              />
            </label>

            {error ? (
              <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            {successMessage ? (
              <div className="space-y-3 rounded-2xl bg-olive/10 px-4 py-4 text-sm text-ink">
                <p>{successMessage}</p>
                {previewResetUrl ? (
                  <a
                    href={previewResetUrl}
                    className="inline-flex font-semibold text-olive"
                  >
                    Open reset page
                  </a>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full justify-center rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Preparing reset link..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-sm text-ink/68">
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="inline-flex font-semibold text-olive">
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
