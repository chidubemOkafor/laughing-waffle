"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";
import { plans } from "@/lib/plans";
import { buildUsageMeters, formatUsageValue, type UsageResponse } from "@/lib/usage";

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="h-2 overflow-hidden rounded-full bg-cloud">
      <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function BillingPage() {
  const { activeProject } = useProjects();
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      setLoadingUsage(true);

      try {
        const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/usage`, {
          credentials: "include"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as UsageResponse;

        if (!cancelled) {
          setUsage(data);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsage(false);
        }
      }
    }

    loadUsage();

    return () => {
      cancelled = true;
    };
  }, [activeProject.id]);

  const usageMeters = usage ? buildUsageMeters(usage) : [];
  const planName = usage?.plan ? `${usage.plan.charAt(0).toUpperCase()}${usage.plan.slice(1)}` : "Free";

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate">Billing</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">Plan and usage</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
              Manage your current plan, usage limits, and future upgrade options.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
          >
            View pricing
          </Link>
        </section>

        <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-cloud bg-white/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate">Current plan</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">{planName} beta</h2>
                  <p className="mt-2 text-sm leading-6 text-slate">
                    Usage is now tracked by the backend. Payment and hard plan enforcement can be connected next.
                  </p>
                </div>
                <span className="rounded-full bg-[rgba(35,184,169,0.12)] px-3 py-1 text-xs font-semibold text-[#127b72]">
                  Active
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-cloud bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate">Usage this month</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{planName} plan limits</h2>
            <div className="mt-5 space-y-5">
              {loadingUsage ? (
                <p className="text-sm text-slate">Loading usage...</p>
              ) : null}
              {!loadingUsage && usageMeters.length === 0 ? (
                <p className="text-sm text-slate">Usage is unavailable right now.</p>
              ) : null}
              {usageMeters.map((meter) => (
                <div key={meter.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{meter.label}</p>
                      <p className="text-xs text-slate">{meter.detail}</p>
                    </div>
                    <p className="text-sm font-bold text-slate">
                      {formatUsageValue(meter.used, meter.unit)} / {formatUsageValue(meter.limit, meter.unit)}
                    </p>
                  </div>
                  <UsageBar used={meter.used} limit={meter.limit} />
                </div>
              ))}
            </div>
          </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-cloud bg-white/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate">Upgrade options</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Plans</h2>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-slate">Coming soon</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
            {plans
              .filter((plan) => plan.name !== "Free")
              .map((plan) => (
                <article
                  key={plan.name}
                  className={[
                    "rounded-2xl border p-4",
                    plan.featured ? "border-coral bg-[rgba(255,107,90,0.04)]" : "border-cloud bg-paper/50"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">{plan.audience}</p>
                      <h3 className="mt-2 text-lg font-semibold text-ink">{plan.name}</h3>
                    </div>
                    {plan.badge ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-coral">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-2xl font-semibold">{plan.price}</span>
                    <span className="pb-1 text-sm text-slate">{plan.period}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate">{plan.description}</p>
                  <button
                    className={[
                      "mt-5 h-10 w-full rounded-lg text-sm font-semibold transition",
                      plan.featured
                        ? "bg-coral text-white hover:bg-[#ef5a49]"
                        : "border border-cloud bg-paper text-ink hover:border-slate/40"
                    ].join(" ")}
                    type="button"
                  >
                    Stripe checkout coming soon
                  </button>
                  <ul className="mt-5 space-y-2">
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="text-sm text-slate">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
