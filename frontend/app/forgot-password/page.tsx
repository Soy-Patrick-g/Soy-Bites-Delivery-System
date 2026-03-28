"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
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
      setSuccessMessage("If an account exists for that email address, you can continue with password reset below.");
      setPreviewResetUrl(result.previewResetUrl ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to prepare a password reset link");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Forgot Password"
      title="Reset access without creating a new account"
      description="Enter the email address tied to your FoodHub account and we&apos;ll prepare a password reset link."
      leftContent={
        <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-citrus">How it works</p>
          <p className="mt-3 leading-7 text-cream/72">
            We&apos;ll help you reset your password securely so you can get back into your account as quickly as possible.
          </p>
        </div>
      }
    >
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
                    Continue to reset password
                  </a>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action w-full justify-center disabled:opacity-60"
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
    </AuthSplitLayout>
  );
}
