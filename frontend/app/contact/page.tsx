import { StaticPageShell } from "@/components/StaticPageShell";
import { APP_NAME } from "@/lib/brand";

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title={`Get in touch with the ${APP_NAME} team`}
      intro="Reach out for account support, delivery questions, restaurant onboarding help, or general platform assistance."
    >
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Support</h2>
        <p className="mt-4 muted-copy">Email: support@foodhub.app</p>
        <p className="mt-2 muted-copy">Hours: Monday to Saturday, 8:00 AM to 8:00 PM</p>
      </article>
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Business inquiries</h2>
        <p className="mt-4 muted-copy">Email: partners@foodhub.app</p>
        <p className="mt-2 muted-copy">For restaurant onboarding, operations, and partnership questions.</p>
      </article>
    </StaticPageShell>
  );
}
