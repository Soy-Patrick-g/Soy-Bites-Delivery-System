"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LocationPicker } from "@/components/LocationPicker";
import { PasswordField } from "@/components/PasswordField";
import { ProfileImagePicker } from "@/components/ProfileImagePicker";
import { registerDeliveryPerson } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import type { LocationSelection } from "@/lib/location";
import { isStrongPassword, STRONG_PASSWORD_RULE } from "@/lib/password";

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    city: "",
    vehicleType: ""
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<LocationSelection>({
    address: "",
    city: "",
    latitude: 5.5725,
    longitude: -0.176
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isStrongPassword(form.password)) {
      setError(STRONG_PASSWORD_RULE);
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const session = await registerDeliveryPerson({
        ...form,
        confirmPassword,
        profileImageUrl,
        city: location.city || form.city,
        latitude: location.latitude,
        longitude: location.longitude
      });
      login(session);
      router.push("/delivery/dashboard");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to register rider");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[36px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-citrus">Delivery onboarding</p>
          <h1 className="mt-3 font-serif text-5xl">Create your rider account and start claiming routes</h1>
          <p className="mt-5 text-sm leading-7 text-cream/72">
            Set up your rider profile, choose your service area, and start accepting delivery routes when you are approved.
          </p>
        </section>

        <section className="rounded-[36px] border border-white/50 bg-white/90 p-8 shadow-soft">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <PasswordField label="Password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
            <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
            <Field label="Vehicle type" value={form.vehicleType} onChange={(value) => setForm({ ...form, vehicleType: value })} />
            <div className="md:col-span-2 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
              Strong password required: {STRONG_PASSWORD_RULE}
            </div>
            <div className="md:col-span-2">
              <ProfileImagePicker
                name={form.fullName || `${APP_NAME} rider`}
                imageUrl={profileImageUrl}
                onChange={setProfileImageUrl}
                description="Upload a rider photo now or continue with the default avatar."
              />
            </div>
            <div className="md:col-span-2">
              <LocationPicker
                title="Rider base location"
                description="Use your current location or choose a point on the map to set the area where you usually begin deliveries."
                value={location}
                onChange={(nextLocation) => {
                  setLocation(nextLocation);
                  setForm((current) => ({
                    ...current,
                    city: nextLocation.city || current.city
                  }));
                }}
              />
            </div>

            {error ? (
              <p className="md:col-span-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Creating rider..." : "Create rider account"}
              </button>
              <Link href="/login" className="inline-flex items-center font-semibold text-olive">
                Back to login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/70">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
      />
    </label>
  );
}
