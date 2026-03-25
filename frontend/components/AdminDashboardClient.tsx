"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { DashboardStat } from "@/components/DashboardStat";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import {
  deleteAdminUser,
  exportAdminTransactionsCsv,
  formatCurrency,
  getAdminAuditLogs,
  getAdminRestaurants,
  getAdminSessions,
  getAdminTransactions,
  getAdminUsers,
  getDashboard
  ,
  updateAdminRestaurantStatus,
  updateAdminRestaurantVerification,
  updateAdminUserStatus
} from "@/lib/api";
import {
  AdminAuditLog,
  AdminDashboard,
  AdminRestaurant,
  AdminSessionRecord,
  AdminTrendPoint,
  AdminTransaction,
  AdminTransactionFilters,
  AdminUserInsight
} from "@/lib/types";

const DEFAULT_FILTERS: AdminTransactionFilters = {
  status: "",
  search: "",
  minAmount: "",
  maxAmount: "",
  start: "",
  end: "",
  sortBy: "date",
  sortDirection: "desc"
};

const FIELD_CLASS = "w-full rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm text-cream outline-none";

export function AdminDashboardClient() {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [sessions, setSessions] = useState<AdminSessionRecord[]>([]);
  const [users, setUsers] = useState<AdminUserInsight[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [draftFilters, setDraftFilters] = useState<AdminTransactionFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<AdminTransactionFilters>(DEFAULT_FILTERS);
  const [userSearchDraft, setUserSearchDraft] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [restaurantSearchDraft, setRestaurantSearchDraft] = useState("");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(true);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const showDashboardSlowLoadNotice = useSlowLoadNotice(isLoading);
  const showTransactionsSlowLoadNotice = useSlowLoadNotice(isTransactionsLoading);
  const showUsersSlowLoadNotice = useSlowLoadNotice(isUsersLoading);
  const showRestaurantsSlowLoadNotice = useSlowLoadNotice(isRestaurantsLoading);

  useEffect(() => {
    if (!isReady || !session || session.role !== "ADMIN") {
      setIsLoading(false);
      return;
    }

    const adminToken = session.token;
    let isCancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const [nextDashboard, nextTransactions, nextAuditLogs, nextSessions, nextUsers, nextRestaurants] = await Promise.all([
          getDashboard(adminToken),
          getAdminTransactions(adminToken, filters),
          getAdminAuditLogs(adminToken),
          getAdminSessions(adminToken),
          getAdminUsers(adminToken, userSearch),
          getAdminRestaurants(adminToken, restaurantSearch)
        ]);

        if (isCancelled) {
          return;
        }

        setDashboard(nextDashboard);
        setTransactions(nextTransactions);
        setAuditLogs(nextAuditLogs);
        setSessions(nextSessions);
        setUsers(nextUsers);
        setRestaurants(nextRestaurants);
      } catch (nextError) {
        if (!isCancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load admin dashboard");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsTransactionsLoading(false);
          setIsUsersLoading(false);
          setIsRestaurantsLoading(false);
        }
      }
    }

    void load();
    const intervalId = window.setInterval(() => {
      setRefreshKey((current) => current + 1);
    }, 60000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [filters, isReady, refreshKey, restaurantSearch, session, userSearch]);

  async function handleTransactionFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsTransactionsLoading(true);
    setFilters({
      ...draftFilters,
      start: toIsoString(draftFilters.start),
      end: toIsoString(draftFilters.end)
    });
  }

  async function handleUserSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUsersLoading(true);
    setUserSearch(userSearchDraft.trim());
  }

  async function handleRestaurantSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRestaurantsLoading(true);
    setRestaurantSearch(restaurantSearchDraft.trim());
  }

  async function handleToggleUserActive(user: AdminUserInsight) {
    if (!session) {
      return;
    }

    try {
      setBusyActionKey(`user-status-${user.id}`);
      setError(null);
      const updated = await updateAdminUserStatus(session.token, user.id, !user.active);
      setUsers((current) => current.map((entry) => (entry.id === user.id ? updated : entry)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update user");
    } finally {
      setBusyActionKey(null);
    }
  }

  async function handleDeleteUser(user: AdminUserInsight) {
    if (!session) {
      return;
    }

    if (!window.confirm(`Delete ${user.email}? This only works for accounts without platform history.`)) {
      return;
    }

    try {
      setBusyActionKey(`user-delete-${user.id}`);
      setError(null);
      await deleteAdminUser(session.token, user.id);
      setUsers((current) => current.filter((entry) => entry.id !== user.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete user");
    } finally {
      setBusyActionKey(null);
    }
  }

  async function handleToggleRestaurantVerification(restaurant: AdminRestaurant) {
    if (!session) {
      return;
    }

    try {
      setBusyActionKey(`restaurant-verify-${restaurant.id}`);
      setError(null);
      const updated = await updateAdminRestaurantVerification(session.token, restaurant.id, !restaurant.verified);
      setRestaurants((current) => current.map((entry) => (entry.id === restaurant.id ? updated : entry)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update restaurant verification");
    } finally {
      setBusyActionKey(null);
    }
  }

  async function handleToggleRestaurantActive(restaurant: AdminRestaurant) {
    if (!session) {
      return;
    }

    try {
      setBusyActionKey(`restaurant-status-${restaurant.id}`);
      setError(null);
      const updated = await updateAdminRestaurantStatus(session.token, restaurant.id, !restaurant.active);
      setRestaurants((current) => current.map((entry) => (entry.id === restaurant.id ? updated : entry)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update restaurant status");
    } finally {
      setBusyActionKey(null);
    }
  }

  async function handleExportCsv() {
    if (!session) {
      return;
    }

    try {
      setIsExportingCsv(true);
      const blob = await exportAdminTransactionsCsv(session.token, filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "foodhub-transactions.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to export CSV");
    } finally {
      setIsExportingCsv(false);
    }
  }

  function handleExportPdf() {
    const popup = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
    if (!popup) {
      setError("Popup blocked while preparing PDF export.");
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>FoodHub Transactions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 8px; }
            p { color: #4b5563; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>FoodHub Transactions</h1>
          <p>Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date/Time</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (transaction) => `
                    <tr>
                      <td>${transaction.id}</td>
                      <td>${escapeHtml(transaction.userEmail)}</td>
                      <td>${escapeHtml(formatCurrency(transaction.amount))}</td>
                      <td>${escapeHtml(transaction.status)}</td>
                      <td>${escapeHtml(formatDateTime(transaction.createdAt))}</td>
                      <td>${escapeHtml(transaction.method)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  if (!isReady || isLoading) {
    return (
      <Shell>
        <div className="space-y-3">
          <p className="text-sm text-cream/70">Loading admin dashboard...</p>
          {showDashboardSlowLoadNotice ? (
            <p className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-cream/72">
              This is taking longer than usual, but the admin dashboard is still loading.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <GateCard
          title="Admin login required"
          body="Sign in with the admin account to access financial metrics, transactions, sessions, and audit logs."
          href={`/login?redirect=${encodeURIComponent("/admin")}`}
          action="Login as admin"
        />
      </Shell>
    );
  }

  if (session.role !== "ADMIN") {
    return (
      <Shell>
        <GateCard
          title="Admin access only"
          body={`You are signed in as ${session.role}. Use the admin account to open this dashboard.`}
          href={`/login?redirect=${encodeURIComponent("/admin")}`}
          action="Switch account"
        />
      </Shell>
    );
  }

  if (error || !dashboard) {
    return (
      <Shell>
        <p className="rounded-3xl border border-red-300/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error ?? "Unable to load dashboard."}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Revenue" value={formatCurrency(dashboard.totalRevenue)} hint="Paid transactions processed" />
        <DashboardStat label="Net settlement" value={formatCurrency(dashboard.netSettlementAmount)} hint="Revenue minus refunds and chargebacks" />
        <DashboardStat label="Active sessions" value={String(dashboard.activeSessions)} hint="Currently valid tracked sessions" />
        <DashboardStat label="Users" value={String(dashboard.totalUsers)} hint="Registered accounts across all roles" />
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Transactions today" value={String(dashboard.transactionsToday)} hint="Transactions created since midnight" />
        <DashboardStat label="Transactions month" value={String(dashboard.transactionsThisMonth)} hint="Transactions created this month" />
        <DashboardStat label="Transactions year" value={String(dashboard.transactionsThisYear)} hint="Transactions created this year" />
        <DashboardStat label="Owner allocations" value={formatCurrency(dashboard.totalOwnerAllocations)} hint="Paid revenue assigned to restaurant owners" />
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <MetricCard
          title="Refunds"
          value={formatCurrency(dashboard.refundsTotal)}
          detail="Tracked refund volume"
        />
        <MetricCard
          title="Chargebacks"
          value={formatCurrency(dashboard.chargebacksTotal)}
          detail="Tracked chargeback volume"
        />
      </section>

      <section className="mt-10 rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-citrus">Earning history</p>
            <h2 className="mt-2 text-3xl font-semibold">Revenue over the last 7 days</h2>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-cream"
          >
            Refresh now
          </button>
        </div>
        <div className="mt-6">
          <EarningsHistoryChart points={dashboard.volumeTrends} />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.volumeTrends.map((point) => (
            <div key={point.label} className="rounded-3xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-citrus">{point.label}</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(point.volume)}</p>
              <p className="mt-2 text-sm text-cream/70">{point.transactionCount} transactions</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-citrus">Transactions</p>
            <h2 className="mt-2 text-3xl font-semibold">Detailed transaction list</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="inline-flex rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-cream disabled:opacity-60"
            >
              {isExportingCsv ? "Exporting CSV..." : "Export CSV"}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex rounded-full bg-citrus px-5 py-2 text-sm font-semibold text-ink"
            >
              Export PDF
            </button>
          </div>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleTransactionFilterSubmit}>
          <FilterInput label="Search">
              <input
                value={draftFilters.search ?? ""}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                className={FIELD_CLASS}
                placeholder="Reference, user, method"
              />
          </FilterInput>
          <FilterInput label="Status">
            <select
              value={draftFilters.status ?? ""}
              onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
              className={FIELD_CLASS}
            >
              <option value="">All</option>
              <option value="INITIALIZED">Initialized</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </FilterInput>
          <FilterInput label="Min amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={draftFilters.minAmount ?? ""}
              onChange={(event) => setDraftFilters((current) => ({ ...current, minAmount: event.target.value }))}
              className={FIELD_CLASS}
            />
          </FilterInput>
          <FilterInput label="Max amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={draftFilters.maxAmount ?? ""}
              onChange={(event) => setDraftFilters((current) => ({ ...current, maxAmount: event.target.value }))}
              className={FIELD_CLASS}
            />
          </FilterInput>
          <FilterInput label="From">
            <input
              type="datetime-local"
              value={fromIsoToLocalInput(draftFilters.start)}
              onChange={(event) => setDraftFilters((current) => ({ ...current, start: event.target.value }))}
              className={FIELD_CLASS}
            />
          </FilterInput>
          <FilterInput label="To">
            <input
              type="datetime-local"
              value={fromIsoToLocalInput(draftFilters.end)}
              onChange={(event) => setDraftFilters((current) => ({ ...current, end: event.target.value }))}
              className={FIELD_CLASS}
            />
          </FilterInput>
          <FilterInput label="Sort by">
            <select
              value={draftFilters.sortBy ?? "date"}
              onChange={(event) => setDraftFilters((current) => ({ ...current, sortBy: event.target.value }))}
              className={FIELD_CLASS}
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
              <option value="user">User</option>
              <option value="id">ID</option>
            </select>
          </FilterInput>
          <FilterInput label="Direction">
            <select
              value={draftFilters.sortDirection ?? "desc"}
              onChange={(event) => setDraftFilters((current) => ({ ...current, sortDirection: event.target.value }))}
              className={FIELD_CLASS}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </FilterInput>

          <div className="md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white"
            >
              Apply transaction filters
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-cream/70">
              <tr className="border-b border-white/10">
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Date / Time</th>
                <th className="px-3 py-3">Method</th>
                <th className="px-3 py-3">Flags</th>
              </tr>
            </thead>
            <tbody>
              {isTransactionsLoading ? (
                <tr>
                  <td className="px-3 py-4 text-cream/70" colSpan={7}>
                    Loading transactions...
                    {showTransactionsSlowLoadNotice ? " This is taking longer than usual, but the request is still running." : ""}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-cream/70" colSpan={7}>No transactions match the current filters.</td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/6">
                    <td className="px-3 py-4">#{transaction.id}</td>
                    <td className="px-3 py-4">
                      <div className="font-medium text-cream">{transaction.userName}</div>
                      <div className="text-xs text-cream/65">{transaction.userEmail}</div>
                    </td>
                    <td className="px-3 py-4">{formatCurrency(transaction.amount)}</td>
                    <td className="px-3 py-4">{transaction.status}</td>
                    <td className="px-3 py-4">{formatDateTime(transaction.createdAt)}</td>
                    <td className="px-3 py-4">{transaction.method}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {transaction.highValue ? <Badge tone="amber">High value</Badge> : null}
                        {transaction.refundedAmount > 0 ? <Badge tone="red">Refund</Badge> : null}
                        {transaction.chargebackAmount > 0 ? <Badge tone="red">Chargeback</Badge> : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-citrus">User insights</p>
              <h2 className="mt-2 text-3xl font-semibold">Accounts, balances, and flags</h2>
            </div>
            <form className="flex gap-3" onSubmit={handleUserSearchSubmit}>
              <input
                value={userSearchDraft}
                onChange={(event) => setUserSearchDraft(event.target.value)}
                placeholder="Search users"
                className={`${FIELD_CLASS} min-w-[220px]`}
              />
              <button type="submit" className="inline-flex rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white">
                Search
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-4">
            {isUsersLoading ? (
              <p className="text-sm text-cream/70">
                Loading users...
                {showUsersSlowLoadNotice ? " This is taking longer than usual, but the request is still running." : ""}
              </p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="rounded-3xl border border-white/10 bg-white/8 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{user.fullName}</p>
                      <p className="text-sm text-cream/70">{user.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="neutral">{user.role}</Badge>
                        <Badge tone={user.active ? "green" : "red"}>{user.active ? "Active" : "Suspended"}</Badge>
                        <Badge tone={user.kycStatus === "VERIFIED" ? "green" : "amber"}>{user.kycStatus}</Badge>
                        {user.riskFlagged ? <Badge tone="red">Flagged</Badge> : null}
                      </div>
                    </div>
                    <div className="text-sm text-cream/70">
                      <div>Balance: {formatCurrency(user.balance)}</div>
                      <div className="mt-1">Transactions: {user.transactionCount}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleUserActive(user)}
                      disabled={busyActionKey === `user-status-${user.id}`}
                      className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busyActionKey === `user-status-${user.id}`
                        ? "Updating..."
                        : user.active
                          ? "Suspend account"
                          : "Reactivate account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteUser(user)}
                      disabled={busyActionKey === `user-delete-${user.id}` || user.email === session.email}
                      className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 disabled:opacity-50"
                    >
                      {busyActionKey === `user-delete-${user.id}` ? "Deleting..." : "Delete account"}
                    </button>
                  </div>
                  {user.alertNote ? (
                    <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {user.alertNote}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    {user.recentTransactions.length === 0 ? (
                      <p className="text-sm text-cream/65">No transaction history recorded for this user.</p>
                    ) : (
                      user.recentTransactions.map((transaction) => (
                        <div key={transaction.transactionId} className="flex flex-col gap-1 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                          <span>{transaction.reference}</span>
                          <span>{formatCurrency(transaction.amount)}</span>
                          <span>{transaction.status}</span>
                          <span className="text-cream/60">{formatDateTime(transaction.createdAt)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
            <p className="text-sm uppercase tracking-[0.18em] text-citrus">Sessions</p>
            <h2 className="mt-2 text-3xl font-semibold">Active session inventory</h2>
            <div className="mt-6 space-y-3">
              {sessions.map((record) => (
                <div key={record.id} className="rounded-3xl border border-white/10 bg-white/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{record.userName}</p>
                      <p className="text-sm text-cream/70">{record.userEmail}</p>
                    </div>
                    <Badge tone="neutral">{record.userRole}</Badge>
                  </div>
                  <div className="mt-3 text-sm text-cream/70">
                    <p>IP: {record.ipAddress}</p>
                    <p>Last seen: {formatDateTime(record.lastSeenAt)}</p>
                    <p>Expires: {formatDateTime(record.expiresAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
            <p className="text-sm uppercase tracking-[0.18em] text-citrus">Audit log</p>
            <h2 className="mt-2 text-3xl font-semibold">Recent administrative trace</h2>
            <div className="mt-6 space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-white/10 bg-white/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{log.action}</p>
                      <p className="text-sm text-cream/70">{log.actorEmail} · {log.actorRole}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.14em] text-citrus">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm text-cream/70">
                    {log.targetType}{log.targetId ? ` #${log.targetId}` : ""}{log.ipAddress ? ` · ${log.ipAddress}` : ""}
                  </p>
                  {log.details ? <p className="mt-2 text-sm text-cream/80">{log.details}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-citrus">Restaurant controls</p>
            <h2 className="mt-2 text-3xl font-semibold">Verify, unverify, activate, or deactivate restaurants</h2>
          </div>
          <form className="flex gap-3" onSubmit={handleRestaurantSearchSubmit}>
            <input
              value={restaurantSearchDraft}
              onChange={(event) => setRestaurantSearchDraft(event.target.value)}
              placeholder="Search restaurants"
              className={`${FIELD_CLASS} min-w-[240px]`}
            />
            <button type="submit" className="inline-flex rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white">
              Search
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-4">
          {isRestaurantsLoading ? (
            <p className="text-sm text-cream/70">
              Loading restaurants...
              {showRestaurantsSlowLoadNotice ? " This is taking longer than usual, but the request is still running." : ""}
            </p>
          ) : restaurants.length === 0 ? (
            <p className="text-sm text-cream/70">No restaurants matched the current search.</p>
          ) : (
            restaurants.map((restaurant) => (
              <div key={restaurant.id} className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{restaurant.brandName ? `${restaurant.brandName} · ${restaurant.name}` : restaurant.name}</p>
                    <p className="text-sm text-cream/70">{restaurant.ownerEmail ?? "No owner email"}{restaurant.ownerName ? ` · ${restaurant.ownerName}` : ""}</p>
                    <p className="mt-2 text-sm text-cream/68">{restaurant.address}, {restaurant.city}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={restaurant.active ? "green" : "red"}>{restaurant.active ? "Active" : "Inactive"}</Badge>
                      <Badge tone={restaurant.verified ? "green" : "amber"}>{restaurant.verified ? "Verified" : "Unverified"}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-cream/65">
                    Created {formatDateTime(restaurant.createdAt)}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleToggleRestaurantVerification(restaurant)}
                    disabled={busyActionKey === `restaurant-verify-${restaurant.id}`}
                    className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
                  >
                    {busyActionKey === `restaurant-verify-${restaurant.id}`
                      ? "Updating..."
                      : restaurant.verified
                        ? "Set unverified"
                        : "Set verified"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleRestaurantActive(restaurant)}
                    disabled={busyActionKey === `restaurant-status-${restaurant.id}`}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-cream disabled:opacity-60"
                  >
                    {busyActionKey === `restaurant-status-${restaurant.id}`
                      ? "Updating..."
                      : restaurant.active
                        ? "Deactivate restaurant"
                        : "Reactivate restaurant"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10 rounded-[36px] border border-white/10 bg-white/6 p-5 shadow-soft sm:p-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.18em] text-citrus">Top restaurants</p>
          <h2 className="mt-2 text-3xl font-semibold">Current customer favorites</h2>
        </div>
        <div className="grid gap-4">
          {dashboard.topRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="grid gap-3 rounded-3xl border border-white/10 bg-white/8 p-5 lg:grid-cols-[1.2fr_0.8fr_0.6fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-citrus">{restaurant.cuisine}</p>
                <h3 className="mt-2 text-2xl font-semibold">{restaurant.name}</h3>
                <p className="mt-2 text-sm text-cream/68">{restaurant.address}</p>
              </div>
              <div className="self-center text-sm text-cream/72">
                <p>{restaurant.distanceKm?.toFixed(1) ?? "--"} km typical delivery radius</p>
                <p className="mt-2">{formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} average fee</p>
              </div>
              <div className="self-center text-right text-3xl font-semibold">
                {restaurant.averageRating.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-ink py-12 text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-citrus">Admin dashboard</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Operations, finance, and trust</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/70">
            Monitor financial performance, review transaction anomalies, inspect active sessions, and audit platform activity from one secured control surface.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 text-cream shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-cream/60">{title}</p>
      <h3 className="mt-4 text-4xl font-semibold">{value}</h3>
      <p className="mt-3 text-sm text-cream/70">{detail}</p>
    </div>
  );
}

function EarningsHistoryChart({ points }: { points: AdminTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-10 text-sm text-cream/65">
        No earning history is available yet.
      </div>
    );
  }

  const width = 720;
  const height = 260;
  const paddingX = 28;
  const paddingTop = 20;
  const paddingBottom = 38;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;
  const maxVolume = Math.max(...points.map((point) => point.volume), 1);
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const pathPoints = points.map((point, index) => {
    const x = paddingX + stepX * index;
    const y = paddingTop + chartHeight - point.volume / maxVolume * chartHeight;
    return { ...point, x, y };
  });

  const linePath = pathPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1]?.x ?? paddingX} ${height - paddingBottom} L ${pathPoints[0]?.x ?? paddingX} ${height - paddingBottom} Z`;

  return (
    <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-citrus">Gross earnings</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(points[points.length - 1]?.volume ?? 0)}</p>
        </div>
        <p className="text-sm text-cream/68">
          Daily payment totals tracked across the last 7 days.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px]">
          <defs>
            <linearGradient id="earnings-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f3c94d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f3c94d" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight - chartHeight * ratio;
            const value = maxVolume * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255,255,255,0.10)"
                  strokeDasharray="4 8"
                />
                <text
                  x={paddingX}
                  y={y - 6}
                  fill="rgba(255,244,221,0.66)"
                  fontSize="11"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#earnings-fill)" />
          <path d={linePath} fill="none" stroke="#f3c94d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {pathPoints.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="6" fill="#f97316" stroke="#1a1712" strokeWidth="3" />
              <text
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                fill="rgba(255,244,221,0.75)"
                fontSize="12"
              >
                {formatShortDay(point.label)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function FilterInput({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-cream/70">{label}</span>
      {children}
    </label>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "neutral" | "amber" | "green" | "red" }) {
  const styles = {
    neutral: "border-white/15 bg-white/10 text-cream",
    amber: "border-amber-300/30 bg-amber-500/10 text-amber-100",
    green: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
    red: "border-red-300/30 bg-red-500/10 text-red-100"
  } satisfies Record<string, string>;

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function GateCard(props: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-semibold">{props.title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-cream/70">{props.body}</p>
      <Link
        href={props.href}
        className="mt-6 inline-flex rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-ink"
      >
        {props.action}
      </Link>
    </div>
  );
}

function toIsoString(value?: string) {
  if (!value) {
    return "";
  }
  return new Date(value).toISOString();
}

function fromIsoToLocalInput(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatShortDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GH", {
    weekday: "short"
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
