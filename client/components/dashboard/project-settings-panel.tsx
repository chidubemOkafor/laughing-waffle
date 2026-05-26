"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import { useProjects } from "@/components/dashboard/project-context";
import { API_URL } from "@/lib/api";

function formatEnvironment(environment: string) {
  return environment.charAt(0).toUpperCase() + environment.slice(1);
}

export function ProjectSettingsPanel() {
  const router = useRouter();
  const { projects, activeProjectId, loading, setActiveProjectId, refreshProjects } = useProjects();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(projectId: string) {
    setError("");
    setDeletingId(projectId);

    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Unable to delete project.");
        return;
      }

      setConfirmId(null);
      await refreshProjects();

      const remaining = projects.filter((p) => p.id !== projectId);
      if (remaining.length === 0) {
        router.replace("/onboarding" as Route);
      } else if (activeProjectId === projectId) {
        setActiveProjectId(remaining[0].id);
      }
    } catch {
      setError("Unable to reach the backend.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 rounded-lg border border-cloud bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-cloud px-4 py-3">
          <h3 className="text-base font-semibold text-ink">Projects</h3>
          {loading ? <span className="text-xs font-medium text-slate">Syncing...</span> : null}
        </div>

        {error ? (
          <p className="border-b border-cloud bg-[rgba(255,107,90,0.08)] px-4 py-2 text-sm text-[#b83628]">{error}</p>
        ) : null}

        <div className="divide-y divide-cloud">
          {projects.map((project) => (
            <div key={project.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setActiveProjectId(project.id)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{project.name}</p>
                    {project.id === activeProjectId ? (
                      <span className="rounded-full bg-[rgba(35,184,169,0.12)] px-2 py-0.5 text-xs font-semibold text-[#127b72]">
                        Current
                      </span>
                    ) : null}
                    {project.isOwner === false ? (
                      <span className="rounded-full bg-[rgba(91,141,239,0.12)] px-2 py-0.5 text-xs font-semibold text-[#2c5eb5]">
                        Editor
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate">{project.description || "No description yet."}</p>
                  {project.slug ? <p className="mt-1 text-xs font-medium text-slate">/{project.slug}</p> : null}
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate">{formatEnvironment(project.environment)}</span>
                  {project.isOwner !== false ? (
                    confirmId === project.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate">Delete?</span>
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#b83628] transition hover:underline disabled:opacity-50"
                          disabled={deletingId === project.id}
                          onClick={() => handleDelete(project.id)}
                        >
                          {deletingId === project.id ? "Deleting..." : "Yes, delete"}
                        </button>
                        <button
                          type="button"
                          className="text-xs font-medium text-slate transition hover:text-ink"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-xs font-medium text-slate transition hover:text-[#b83628]"
                        onClick={() => { setError(""); setConfirmId(project.id); }}
                      >
                        Delete
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="min-w-0 rounded-lg border border-cloud bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Project model</h3>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate">
          <p>Create a project when you are ready to publish or manage content.</p>
          <p>Projects keep posts, media, API keys, and settings separated.</p>
          <p>Plan limits can later control how many projects a workspace can create.</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-cloud bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate/40"
        >
          Create another project
        </Link>
      </aside>
    </section>
  );
}
