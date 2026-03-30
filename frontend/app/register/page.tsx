"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PasswordField } from "@/components/PasswordField";
import { ProfileImagePicker } from "@/components/ProfileImagePicker";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { registerUser } from "@/lib/auth-api";
import { APP_NAME } from "@/lib/brand";
import { isStrongPassword, STRONG_PASSWORD_RULE } from "@/lib/password";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      const session = await registerUser({
        fullName,
        email,
        password,
        confirmPassword,
        profileImageUrl
      });
      login(session);
      router.push("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "We couldn’t create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Create Account"
      title={`Join ${APP_NAME}`}
      description="Create your customer account to order from nearby restaurants, save your details, and track deliveries."
      leftContent={
        <>
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
            <p className="font-semibold uppercase tracking-[0.18em] text-citrus">What you can do</p>
            <p className="mt-3 leading-7 text-cream/72">
              Browse restaurants, place orders, manage your account, and follow every delivery from checkout to drop-off.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm">
            <p className="font-semibold uppercase tracking-[0.18em] text-citrus">Password security</p>
            <p className="mt-3 leading-7 text-cream/72">{STRONG_PASSWORD_RULE}</p>
          </div>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink/70">Full name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Enter your full name"
            className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
            required
          />
        </label>

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
        <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
        <ProfileImagePicker
          name={fullName || `${APP_NAME} customer`}
          imageUrl={profileImageUrl}
          onChange={setProfileImageUrl}
          description={`Add a profile picture now or continue with the default ${APP_NAME} avatar.`}
        />

        {error ? (
          <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-action w-full justify-center disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-sm text-ink/68">
        <p>Already have an account?</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/login" className="inline-flex font-semibold text-olive">
            Sign in
          </Link>
          <Link href="/" className="inline-flex font-semibold text-olive">
            Back to discover
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
