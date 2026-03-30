import { AccountSettingsClient } from "@/components/AccountSettingsClient";

export default function DeliverySettingsPage() {
  return (
    <AccountSettingsClient
      requiredRole="DELIVERY"
      title="Manage your rider profile"
      description="Update the name and profile picture shown across your delivery activity and completed route summaries."
      pageHref="/delivery/settings"
      backHref="/delivery/dashboard"
    />
  );
}
