"use client";

import { Fragment, useEffect, useState } from "react";
import { getProjectApiBase, useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";
import { cachedFetch } from "@/lib/fetch-cache";

type DashboardRange = "7d" | "30d" | "all";
type PostFilter = "all" | "published" | "draft" | "review" | "scheduled";

type DashboardMetric = {
  label: string;
  value: number;
  detail: string;
};

type RecentPost = {
  id: string;
  title: string;
  status: string;
  category: string | null;
  updated: string;
};

type QueueItem = {
  label: string;
  value: number;
  color: string;
};

type DashboardData = {
  metrics: DashboardMetric[];
  recentPosts: RecentPost[];
  queue: QueueItem[];
};

const emptyDashboard: DashboardData = {
  metrics: [
    { label: "Published", value: 0, detail: "No live posts yet" },
    { label: "Drafts", value: 0, detail: "0 ready for review" },
    { label: "API requests", value: 0, detail: "No requests yet" },
    { label: "Active keys", value: 0, detail: "0 expire within 30 days" }
  ],
  recentPosts: [],
  queue: [
    { label: "Review pending", value: 0, color: "bg-amber" },
    { label: "Scheduled", value: 0, color: "bg-sky" },
    { label: "Published today", value: 0, color: "bg-teal" }
  ]
};

const rangeOptions: Array<{ label: string; value: DashboardRange }> = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All time", value: "all" }
];

const filterOptions: Array<{ label: string; value: PostFilter }> = [
  { label: "All posts", value: "all" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Scheduled", value: "scheduled" }
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Published: "bg-[rgba(35,184,169,0.12)] text-[#127b72]",
    Review: "bg-[rgba(244,183,64,0.16)] text-[#875f08]",
    Draft: "bg-cloud text-slate",
    Scheduled: "bg-[rgba(91,141,239,0.14)] text-[#315fa7]"
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-paper text-slate"}`}>
      {status}
    </span>
  );
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export default function DashboardPage() {
  const { activeProject } = useProjects();
  const [range, setRange] = useState<DashboardRange>("7d");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await cachedFetch(
          `${API_URL}/api/projects/${activeProject.id}/dashboard?range=${range}&status=${postFilter}`,
          { credentials: "include", ttl: 60_000 }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error?.message ?? "Unable to load dashboard data.");
        }

        if (active) {
          setDashboard({
            metrics: Array.isArray(data.metrics) ? data.metrics : emptyDashboard.metrics,
            recentPosts: Array.isArray(data.recentPosts) ? data.recentPosts : [],
            queue: Array.isArray(data.queue) ? data.queue : emptyDashboard.queue
          });
        }
      } catch (caughtError) {
        if (active) {
          setDashboard(emptyDashboard);
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [activeProject.id, range, postFilter]);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{activeProject.name}</h1>
            {activeProject.description ? (
              <p className="mt-1 text-sm text-slate">{activeProject.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {rangeOptions.map((option, i) => (
              <Fragment key={option.value}>
                {i > 0 && <span className="select-none text-cloud" aria-hidden>·</span>}
                <button
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={
                    range === option.value
                      ? "font-semibold text-ink"
                      : "text-slate transition hover:text-ink"
                  }
                >
                  {option.label}
                </button>
              </Fragment>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-[rgba(255,107,90,0.08)] px-3 py-2 text-sm text-[#b83628]">{error}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-px bg-cloud sm:grid-cols-4">
          {dashboard.metrics.map((metric) => (
            <div key={metric.label} className="bg-paper px-5 py-5">
              <p className="text-xs text-slate">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">
                {loading ? <span className="text-cloud select-none">—</span> : formatMetricValue(metric.value)}
              </p>
              <p className="mt-1 text-xs text-slate">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-ink">
                Recent posts
                {!loading ? (
                  <span className="ml-1.5 font-normal text-slate">({dashboard.recentPosts.length})</span>
                ) : null}
              </h2>
              <select
                className="h-8 rounded-lg border border-cloud bg-white px-2 text-sm font-medium text-ink outline-none transition focus:border-sky focus:ring-2 focus:ring-[rgba(91,141,239,0.12)]"
                value={postFilter}
                onChange={(event) => setPostFilter(event.target.value as PostFilter)}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-cloud">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-cloud bg-white text-xs uppercase tracking-[0.1em] text-slate">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Title</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Category</th>
                    <th className="px-4 py-2.5 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cloud bg-white">
                  {dashboard.recentPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-paper/50">
                      <td className="px-4 py-3.5 font-medium text-ink">{post.title}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={post.status} /></td>
                      <td className="px-4 py-3.5 text-slate">{post.category || "Uncategorized"}</td>
                      <td className="px-4 py-3.5 text-slate">{post.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && dashboard.recentPosts.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate">
                  No posts match this project and filter yet.
                </p>
              ) : null}
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-slate">Loading...</p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink">Publishing queue</h2>
              <div className="divide-y divide-cloud rounded-lg border border-cloud bg-white">
                {dashboard.queue.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {loading ? "—" : formatMetricValue(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">API endpoint</h2>
                <span className="rounded-full bg-[rgba(35,184,169,0.12)] px-2.5 py-0.5 text-xs font-semibold text-[#127b72]">
                  Live
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-cloud bg-ink px-4 py-3">
                <p className="whitespace-nowrap font-mono text-xs text-white/60">
                  GET {getProjectApiBase(activeProject)}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate">
                Counts over: {rangeOptions.find((o) => o.value === range)?.label}
              </p>
            </div>
          </aside>
        </div>

      </div>
    </main>
  );
}
