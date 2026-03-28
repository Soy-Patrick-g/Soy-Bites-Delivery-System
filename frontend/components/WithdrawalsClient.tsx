"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSlowLoadNotice } from "@/hooks/useSlowLoadNotice";
import { formatCurrency } from "@/lib/api";
import type { CreateWithdrawalRequest, UserRole, WithdrawalBankOption, WithdrawalDashboard, WithdrawalRecord } from "@/lib/types";

type WithdrawalsClientProps = {
  title: string;
  eyebrow: string;
  expectedRole: "DELIVERY" | "RESTAURANT";
  loginHref: string;
  registerHref: string;
  registerAction: string;
  dashboardHref: string;
  getDashboard: (token: string) => Promise<WithdrawalDashboard>;
  getBanks: (token: string) => Promise<WithdrawalBankOption[]>;
  createWithdrawal: (token: string, payload: CreateWithdrawalRequest) => Promise<WithdrawalRecord>;
};

const destinationLabels: Record<WithdrawalBankOption["type"], string> = {
  ghipss: "Bank account",
  mobile_money: "Mobile money"
};

export function WithdrawalsClient(props: WithdrawalsClientProps) {
  const { isReady, session } = useAuth();
  const [dashboard, setDashboard] = useState<WithdrawalDashboard | null>(null);
  const [banks, setBanks] = useState<WithdrawalBankOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateWithdrawalRequest>({
    amount: 0,
    destinationType: "mobile_money",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    reason: ""
  });
  const showSlowLoadNotice = useSlowLoadNotice(isLoading);

  useEffect(() => {
    async function load() {
      if (!session || session.role !== props.expectedRole) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const [nextDashboard, nextBanks] = await Promise.all([
          props.getDashboard(session.token),
          props.getBanks(session.token)
        ]);
        setDashboard(nextDashboard);
        setBanks(nextBanks);
        setForm((current) => ({
          ...current,
          amount: nextDashboard.availableBalance > 0 ? Number(nextDashboard.availableBalance.toFixed(2)) : 0
        }));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load withdrawals");
      } finally {
        setIsLoading(false);
      }
    }

    if (isReady) {
      void load();
    }
  }, [isReady, props, session]);

  const bankOptions = useMemo(
    () => banks.filter((bank) => bank.type === form.destinationType),
    [banks, form.destinationType]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !dashboard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      const record = await props.createWithdrawal(session.token, {
        ...form,
        amount: Number(form.amount)
      });
      const nextDashboard = await props.getDashboard(session.token);
      setDashboard(nextDashboard);
      setSuccessMessage(`Withdrawal request ${record.reference} was submitted successfully.`);
      setForm((current) => ({
        ...current,
        amount: nextDashboard.availableBalance > 0 ? Number(nextDashboard.availableBalance.toFixed(2)) : 0,
        accountNumber: "",
        accountName: "",
        reason: "",
        bankCode: bankOptions[0]?.code ?? current.bankCode
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to submit withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!bankOptions.length) {
      return;
    }

    setForm((current) => {
      if (bankOptions.some((bank) => bank.code === current.bankCode)) {
        return current;
      }

      return {
        ...current,
        bankCode: bankOptions[0]?.code ?? ""
      };
    });
  }, [bankOptions]);

  if (!isReady || isLoading) {
    return (
      <Shell eyebrow={props.eyebrow} title={props.title}>
        <div className="space-y-3">
          <p className="text-sm text-ink/70">Loading withdrawal tools...</p>
          {showSlowLoadNotice ? (
            <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
              This is taking longer than usual, but your withdrawal details are still loading.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell eyebrow={props.eyebrow} title={props.title}>
        <GateCard
          title="Sign in required"
          body="Sign in to manage your withdrawals and payout destination."
          href={props.loginHref}
          action="Login"
        />
      </Shell>
    );
  }

  if (session.role !== props.expectedRole) {
    return (
      <Shell eyebrow={props.eyebrow} title={props.title}>
        <GateCard
          title="This page is not available for your account"
          body={`You are signed in as ${session.role}. Use a ${props.expectedRole.toLowerCase()} account to access withdrawals.`}
          href={props.registerHref}
          action={props.registerAction}
        />
      </Shell>
    );
  }

  if (error && !dashboard) {
    return (
      <Shell eyebrow={props.eyebrow} title={props.title}>
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
      </Shell>
    );
  }

  if (!dashboard) {
    return (
      <Shell eyebrow={props.eyebrow} title={props.title}>
        <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70">
          Your withdrawal dashboard is not available right now. Please refresh and try again.
        </p>
      </Shell>
    );
  }

  return (
    <Shell eyebrow={props.eyebrow} title={props.title}>
      {error ? <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {successMessage ? <p className="mb-6 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-ink p-5 text-cream shadow-soft sm:p-6 lg:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-citrus">Payout profile</p>
          <h2 className="mt-3 text-3xl font-semibold">{dashboard.fullName}</h2>
          <p className="mt-2 text-sm text-cream/65">{dashboard.email}</p>

          <div className="mt-6 rounded-3xl bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-citrus">Available balance</p>
            <p className="mt-3 text-3xl font-semibold">{formatCurrency(dashboard.availableBalance)}</p>
            <p className="mt-2 text-sm text-cream/68">
              This is the amount currently ready to withdraw to your selected payout destination.
            </p>
          </div>

          <div className="mt-6 rounded-3xl bg-white/8 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-citrus">Recent withdrawal count</p>
            <p className="mt-3 text-3xl font-semibold">{dashboard.withdrawals.length}</p>
            <p className="mt-2 text-sm text-cream/68">Every payout attempt stays in your history for traceability.</p>
          </div>

          <div className="mt-6">
            <Link href={props.dashboardHref} className="inline-flex rounded-full bg-citrus px-5 py-2 text-sm font-semibold text-ink">
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-soft sm:p-6 lg:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-olive">Request a payout</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Send funds to your bank or mobile money wallet</h2>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <FormField label="Destination type">
              <select
                value={form.destinationType}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  destinationType: event.target.value as CreateWithdrawalRequest["destinationType"]
                }))}
                className={FIELD_CLASS}
              >
                <option value="mobile_money">Mobile money</option>
                <option value="ghipss">Bank account</option>
              </select>
            </FormField>

            <FormField label="Destination">
              <select
                value={form.bankCode}
                onChange={(event) => setForm((current) => ({ ...current, bankCode: event.target.value }))}
                className={FIELD_CLASS}
              >
                {bankOptions.length ? (
                  bankOptions.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))
                ) : (
                  <option value="">No payout destinations available</option>
                )}
              </select>
            </FormField>

            <FormField label={form.destinationType === "mobile_money" ? "Mobile money number" : "Account number"}>
              <input
                value={form.accountNumber}
                onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
                className={FIELD_CLASS}
                placeholder={form.destinationType === "mobile_money" ? "0551234567" : "0123456789"}
              />
            </FormField>

            <FormField label="Account name">
              <input
                value={form.accountName}
                onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))}
                className={FIELD_CLASS}
                placeholder="Registered account name"
              />
            </FormField>

            <FormField label="Amount (gh₵)">
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={dashboard.availableBalance}
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
                className={FIELD_CLASS}
              />
            </FormField>

            <FormField label="Reason">
              <input
                value={form.reason ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                className={FIELD_CLASS}
                placeholder="Optional payout note"
              />
            </FormField>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || dashboard.availableBalance <= 0 || !form.bankCode}
                className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Request withdrawal"}
              </button>
              <p className="text-sm text-ink/65">
                Available now: {formatCurrency(dashboard.availableBalance)}
              </p>
            </div>
          </form>
        </div>
      </section>

      <section className="mt-10 rounded-[32px] border border-ink/10 bg-white/90 p-5 shadow-soft sm:p-6 lg:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-olive">Withdrawal history</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Recent payout requests</h2>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-ink/65">
              <tr className="border-b border-ink/10">
                <th className="px-3 py-3">Reference</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Destination</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.withdrawals.length ? (
                dashboard.withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-ink/6">
                    <td className="px-3 py-4">
                      <div className="font-medium text-ink">{withdrawal.reference}</div>
                      {withdrawal.reason ? <div className="text-xs text-ink/55">{withdrawal.reason}</div> : null}
                    </td>
                    <td className="px-3 py-4 text-ink">{formatCurrency(withdrawal.amount)}</td>
                    <td className="px-3 py-4 text-ink">
                      <div>{destinationLabels[withdrawal.destinationType]} · {withdrawal.accountName}</div>
                      <div className="text-xs text-ink/55">{withdrawal.accountNumber}</div>
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={withdrawal.status} />
                      {withdrawal.failureReason ? (
                        <div className="mt-1 text-xs text-red-700">{withdrawal.failureReason}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 text-ink/70">{formatDateTime(withdrawal.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-ink/65" colSpan={5}>
                    No withdrawals have been requested yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl text-ink sm:text-5xl">{title}</h1>
      </div>
      {children}
    </main>
  );
}

function GateCard(props: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-[32px] border border-ink/10 bg-white/90 p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-semibold text-ink">{props.title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">{props.body}</p>
      <Link href={props.href} className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white">
        {props.action}
      </Link>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/75">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: WithdrawalRecord["status"] }) {
  const styles = {
    PROCESSING: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700"
  } satisfies Record<WithdrawalRecord["status"], string>;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {status === "PROCESSING" ? "Processing" : status === "COMPLETED" ? "Completed" : "Failed"}
    </span>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const FIELD_CLASS = "w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none";
