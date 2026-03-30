import { AccountSettingsClient } from "@/components/AccountSettingsClient";

export default function SettingsPage() {
  return (
    <AccountSettingsClient
      requiredRole="USER"
      title="Manage your customer profile"
      description="Keep your name and profile picture up to date so your orders and reviews feel personal and recognizable."
      pageHref="/settings"
      backHref="/dashboard"
    />
  );
}
