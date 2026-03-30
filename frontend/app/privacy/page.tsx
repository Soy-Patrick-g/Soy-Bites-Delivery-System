import { StaticPageShell } from "@/components/StaticPageShell";
import { APP_NAME } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Privacy"
      title={`How ${APP_NAME} handles your information`}
      intro={`${APP_NAME} uses account, order, and delivery information to operate the platform, support secure transactions, and improve order fulfillment.`}
    >
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Information we use</h2>
        <p className="mt-4 muted-copy">
          This includes account details, delivery addresses, order records, and operational activity needed to process orders and support the service.
        </p>
      </article>
      <article className="surface-panel p-6">
        <h2 className="text-2xl font-semibold text-ink">Security and access</h2>
        <p className="mt-4 muted-copy">
          Access is limited by role, sessions are authenticated, and platform events are tracked to support account protection and administrative oversight.
        </p>
      </article>
    </StaticPageShell>
  );
}
