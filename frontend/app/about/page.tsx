import { StaticPageShell } from "@/components/StaticPageShell";
import { APP_NAME } from "@/lib/brand";

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="About"
      title="Food delivery built for clarity and trust"
      intro={`${APP_NAME} helps customers order confidently, helps restaurants manage service smoothly, and gives riders the tools they need to complete deliveries reliably.`}
    >
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">What {APP_NAME} focuses on</h2>
        <p className="mt-4 muted-copy">
          Clear restaurant discovery, reliable checkout, transparent order tracking, and operational tools that make the full delivery journey easier to manage.
        </p>
      </article>
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Who it supports</h2>
        <p className="mt-4 muted-copy">
          Customers placing everyday orders, restaurants running multi-branch operations, riders completing routes, and administrators overseeing the platform.
        </p>
      </article>
    </StaticPageShell>
  );
}
