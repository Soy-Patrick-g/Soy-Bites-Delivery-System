import { StaticPageShell } from "@/components/StaticPageShell";

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Terms"
      title="FoodHub terms of use"
      intro="These terms explain the responsibilities and expectations that apply when using FoodHub as a customer, restaurant, rider, or administrator."
    >
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Use of the platform</h2>
        <p className="mt-4 muted-copy">
          Accounts must be used lawfully and accurately. Orders, menu updates, delivery activity, and payouts must reflect real activity on the platform.
        </p>
      </article>
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Payments and fulfillment</h2>
        <p className="mt-4 muted-copy">
          Delivery fees, commissions, settlements, and withdrawals are processed according to the current operating settings and service availability.
        </p>
      </article>
    </StaticPageShell>
  );
}
