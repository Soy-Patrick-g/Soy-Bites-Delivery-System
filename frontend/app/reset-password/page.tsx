"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { resetPassword } from "@/lib/auth-api";
import { isStrongPassword, STRONG_PASSWORD_RULE } from "@/lib/password";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token.trim()) {
      setError("Please open your password reset link or paste the reset code to continue.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(STRONG_PASSWORD_RULE);
      return;
    }

    if (password !== confirmPassword) {
      setError("Your password entries do not match. Please check them and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await resetPassword({
        token: token.trim(),
        password,
        confirmPassword
      });
      setSuccessMessage(result.message);
      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Reset Password"
      title="Choose a new strong password"
      description="Once this password is updated, any older sessions are signed out so the account stays secure."
      leftContent={
        <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-citrus">Password rule</p>
          <p className="mt-3 leading-7 text-cream/72">{STRONG_PASSWORD_RULE}</p>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/70">Reset link or code</span>
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
                placeholder="Paste the reset code if it is not already filled in"
                required
              />
            </label>

            <PasswordField label="New password" value={password} onChange={setPassword} />
            <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />

            {error ? (
              <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl bg-olive/10 px-4 py-3 text-sm text-ink">{successMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action w-full justify-center disabled:opacity-60"
            >
              {isSubmitting ? "Updating password..." : "Reset password"}
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
