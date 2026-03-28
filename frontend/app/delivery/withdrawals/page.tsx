"use client";

import { WithdrawalsClient } from "@/components/WithdrawalsClient";
import {
  createDeliveryWithdrawal,
  getDeliveryWithdrawalBanks,
  getDeliveryWithdrawals
} from "@/lib/api";

export default function DeliveryWithdrawalsPage() {
  return (
    <WithdrawalsClient
      eyebrow="Delivery withdrawals"
      title="Withdraw settled rider earnings"
      expectedRole="DELIVERY"
      loginHref={`/login?redirect=${encodeURIComponent("/delivery/withdrawals")}`}
      registerHref="/delivery/register"
      registerAction="Register as rider"
      dashboardHref="/delivery/dashboard"
      getDashboard={getDeliveryWithdrawals}
      getBanks={getDeliveryWithdrawalBanks}
      createWithdrawal={createDeliveryWithdrawal}
    />
  );
}
