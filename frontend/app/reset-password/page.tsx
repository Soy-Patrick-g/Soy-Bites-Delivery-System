"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { resetPassword, verifyResetToken } from "@/lib/auth-api";
import { isStrongPassword, STRONG_PASSWORD_RULE } from "@/lib/password";

const RESET_CODE_PATTERN = /^[A-Z0-9]{5}$/;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token.trim()) {
      setError("Please open your password reset link or paste the reset code to continue.");
      return;
    }

    if (!RESET_CODE_PATTERN.test(token.trim().toUpperCase())) {
      setError("Enter the 5-character reset code from your email.");
      return;
    }

    try {
      setIsVerifyingToken(true);
      setError(null);
      setVerificationMessage(null);
      const result = await verifyResetToken({ token: token.trim().toUpperCase() });
      setIsTokenVerified(result.valid);
      setVerificationMessage(result.message);
    } catch (nextError) {
      setIsTokenVerified(false);
      setVerificationMessage(null);
      setError(nextError instanceof Error ? nextError.message : "We couldn’t verify that reset code.");
    } finally {
      setIsVerifyingToken(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isTokenVerified) {
      setError("Please verify your reset code before choosing a new password.");
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
        token: token.trim().toUpperCase(),
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
      title="Enter your reset code and choose a new password"
      description="Use the 5-character code from your email. Once your password is updated, any older sessions are signed out."
      leftContent={
        <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-citrus">
            {isTokenVerified ? "Choose a new password" : "Verify your code"}
          </p>
          <p className="mt-3 leading-7 text-cream/72">
            {isTokenVerified
              ? "Your code has been confirmed. Choose a new password that meets this rule:"
              : "Enter the 5-character reset code from your email. We’ll verify it before showing the password form."}
          </p>
          {isTokenVerified ? <p className="mt-3 leading-7 text-cream/72">{STRONG_PASSWORD_RULE}</p> : null}
        </div>
      }
    >
      {isTokenVerified ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-olive/10 px-4 py-3 text-sm text-ink">
            {verificationMessage ?? "Code verified. You can now set a new password."}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Verified reset code</span>
            <input
              value={token}
              readOnly
              className="w-full rounded-2xl border border-ink/10 bg-stone-100 px-4 py-3 text-sm uppercase tracking-[0.28em] text-ink outline-none"
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

          <button
            type="button"
            onClick={() => {
              setIsTokenVerified(false);
              setVerificationMessage(null);
              setPassword("");
              setConfirmPassword("");
              setError(null);
            }}
            className="secondary-action w-full justify-center"
          >
            Use a different code
          </button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={handleVerifyCode}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Reset code</span>
            <input
              value={token}
              onChange={(event) => {
                setToken(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5));
                setError(null);
                setVerificationMessage(null);
              }}
              className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
              placeholder="Enter the 5-character code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={5}
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isVerifyingToken}
            className="primary-action w-full justify-center disabled:opacity-60"
          >
            {isVerifyingToken ? "Verifying code..." : "Verify code"}
          </button>
        </form>
      )}

      <div className="mt-6 text-sm text-ink/68">
        <div className="flex flex-wrap gap-4">
          <Link href="/forgot-password" className="inline-flex font-semibold text-olive">
            Request a new code
          </Link>
          <Link href="/login" className="inline-flex font-semibold text-olive">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
