"use client";

import { WithdrawalsClient } from "@/components/WithdrawalsClient";
import {
  createOwnerWithdrawal,
  getOwnerWithdrawalBanks,
  getOwnerWithdrawals
} from "@/lib/api";

export default function RestaurantWithdrawalsPage() {
  return (
    <WithdrawalsClient
      eyebrow="Restaurant withdrawals"
      title="Withdraw restaurant earnings"
      expectedRole="RESTAURANT"
      loginHref={`/login?redirect=${encodeURIComponent("/restaurant/withdrawals")}`}
      registerHref="/restaurant/register"
      registerAction="Register restaurant"
      dashboardHref="/restaurant/dashboard"
      getDashboard={getOwnerWithdrawals}
      getBanks={getOwnerWithdrawalBanks}
      createWithdrawal={createOwnerWithdrawal}
    />
  );
}
