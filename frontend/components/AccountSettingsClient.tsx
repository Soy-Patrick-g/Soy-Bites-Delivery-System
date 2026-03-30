"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ProfileImagePicker } from "@/components/ProfileImagePicker";
import { getAccountProfile, updateAccountProfile } from "@/lib/api";

type AccountSettingsClientProps = {
  requiredRole: "USER" | "DELIVERY";
  title: string;
  description: string;
  pageHref: string;
  backHref: string;
};

export function AccountSettingsClient({
  requiredRole,
  title,
  description,
  pageHref,
  backHref
}: AccountSettingsClientProps) {
  const router = useRouter();
  const { isReady, session, login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== requiredRole) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const profile = await getAccountProfile(session.token);
        setFullName(profile.fullName);
        setProfileImageUrl(profile.profileImageUrl ?? undefined);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "We couldn’t load your account details.");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, requiredRole, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      const updated = await updateAccountProfile(session.token, {
        fullName,
        profileImageUrl
      });
      login({
        ...session,
        fullName: updated.fullName,
        profileImageUrl: updated.profileImageUrl
      });
      setSuccess("Your profile has been updated.");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "We couldn’t save your profile changes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady || isLoading) {
    return (
      <main className="app-shell py-10 sm:py-14">
        <p className="text-sm text-ink/70">Loading your settings...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="app-shell py-10 sm:py-14">
        <div className="surface-card p-8">
          <h1 className="font-serif text-4xl text-ink">Sign in to manage your profile</h1>
          <p className="mt-4 muted-copy">Please sign in again to update your photo and account details.</p>
          <Link href={`/login?redirect=${encodeURIComponent(pageHref)}`} className="primary-action mt-6">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (session.role !== requiredRole) {
    return (
      <main className="app-shell py-10 sm:py-14">
        <div className="surface-card p-8">
          <h1 className="font-serif text-4xl text-ink">This settings page is not available for your account</h1>
          <p className="mt-4 muted-copy">Please return to the dashboard that matches your signed-in role.</p>
          <Link href={backHref} className="primary-action mt-6">
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell py-10 sm:py-14">
      <section className="surface-card p-8 sm:p-10">
        <p className="eyebrow">Settings</p>
        <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-ink/72">{description}</p>
      </section>

      <section className="mt-8 surface-card p-6 sm:p-8">
        <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          <ProfileImagePicker
            name={fullName || session.fullName}
            imageUrl={profileImageUrl}
            onChange={setProfileImageUrl}
            description="Upload a fresh profile picture or keep using the default avatar."
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Email</span>
            <input
              value={session.email}
              readOnly
              className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60 outline-none"
            />
          </label>

          {error ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting} className="primary-action disabled:opacity-60">
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
            <Link href={backHref} className="secondary-action">
              Back
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
