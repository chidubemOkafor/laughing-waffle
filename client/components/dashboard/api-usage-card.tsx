"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";
import type { UsageResponse } from "@/lib/usage";

const fallbackApiUsage = { used: 0, limit: 1000 };

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export function ApiUsageCard() {
  const { activeProject, projects } = useProjects();
  const [apiUsage, setApiUsage] = useState(fallbackApiUsage);

  useEffect(() => {
    if (projects.length === 0) {
      setApiUsage(fallbackApiUsage);
      return;
    }

    let cancelled = false;

    async function loadUsage() {
      try {
        const response = await fetch(`${API_URL}/api/projects/${activeProject.id}/usage`, {
          credentials: "include"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as UsageResponse;

        if (!cancelled) {
          setApiUsage(data.usage.apiRequests);
        }
      } catch {
        if (!cancelled) {
          setApiUsage(fallbackApiUsage);
        }
      }
    }

    loadUsage();

    return () => {
      cancelled = true;
    };
  }, [activeProject.id, projects.length]);

  const percentage = apiUsage.limit > 0 ? Math.min(100, Math.round((apiUsage.used / apiUsage.limit) * 100)) : 0;

  return (
    <Link
      href="/dashboard/billing"
      className="mx-3 mb-4 block rounded-2xl border border-cloud bg-ink p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(16,19,24,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">API usage</p>
          <p className="mt-2 text-xl font-black">
            {formatCompactNumber(apiUsage.used)}
            <span className="text-sm font-semibold text-white/50"> / {formatCompactNumber(apiUsage.limit)}</span>
          </p>
        </div>
        <span className="rounded-full bg-[rgba(35,184,169,0.18)] px-2.5 py-1 text-xs font-bold text-[#8df4e9]">
          Free
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${percentage}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-white/55">{percentage}% used this month</span>
        <span className="font-bold text-white">Upgrade</span>
      </div>
    </Link>
  );
}
