"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { registerRestaurantOwner } from "@/lib/api";

export default function RestaurantRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "Vendor Owner",
    email: "newvendor@foodhub.dev",
    password: "Password123!",
    restaurantName: "Coastal Bites",
    description: "Fresh bowls, grilled mains, and quick lunch delivery for busy neighborhoods.",
    cuisine: "Contemporary African",
    address: "Spintex Road 12",
    city: "Accra",
    latitude: "5.6037",
    longitude: "-0.1870"
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      const session = await registerRestaurantOwner({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
      login(session);
      router.push("/restaurant/dashboard");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to register restaurant");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[36px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-citrus">Restaurant onboarding</p>
          <h1 className="mt-3 font-serif text-5xl">Create your owner account and storefront together</h1>
          <p className="mt-5 text-sm leading-7 text-cream/72">
            This will create a `RESTAURANT` user and an attached restaurant profile so you can start receiving and processing orders from the dashboard.
          </p>
          <div className="mt-8 rounded-3xl bg-white/8 p-5 text-sm">
            <p className="font-semibold">Already have a vendor account?</p>
            <p className="mt-2 text-cream/70">Use `vendor@foodhub.dev / Password123!` on the login page.</p>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/50 bg-white/90 p-8 shadow-soft">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Owner name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field label="Owner email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Password" value={form.password} type="password" onChange={(value) => setForm({ ...form, password: value })} />
            <Field label="Restaurant name" value={form.restaurantName} onChange={(value) => setForm({ ...form, restaurantName: value })} />
            <Field className="md:col-span-2" label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <Field label="Cuisine" value={form.cuisine} onChange={(value) => setForm({ ...form, cuisine: value })} />
            <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <Field className="md:col-span-2" label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
            <Field label="Latitude" value={form.latitude} onChange={(value) => setForm({ ...form, latitude: value })} />
            <Field label="Longitude" value={form.longitude} onChange={(value) => setForm({ ...form, longitude: value })} />

            {error ? (
              <p className="md:col-span-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Creating restaurant..." : "Create restaurant account"}
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
  className?: string;
}) {
  return (
    <label className={`block ${props.className ?? ""}`}>
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
