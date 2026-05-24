"use client";

import Link from "next/link";
import { useProjects } from "@/components/dashboard/project-context";

function formatEnvironment(environment: string) {
  return environment.charAt(0).toUpperCase() + environment.slice(1);
}

export function ProjectSettingsPanel() {
  const { projects, activeProjectId, loading, setActiveProjectId } = useProjects();

  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 rounded-lg border border-cloud bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-cloud px-4 py-3">
          <h3 className="text-base font-semibold text-ink">Projects</h3>
          {loading ? <span className="text-xs font-medium text-slate">Syncing...</span> : null}
        </div>

        <div className="divide-y divide-cloud">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-paper/70 sm:flex-row sm:items-center sm:justify-between"
              onClick={() => setActiveProjectId(project.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{project.name}</p>
                  {project.id === activeProjectId ? (
                    <span className="rounded-full bg-[rgba(35,184,169,0.12)] px-2 py-0.5 text-xs font-semibold text-[#127b72]">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate">{project.description || "No description yet."}</p>
                {project.slug ? <p className="mt-1 text-xs font-medium text-slate">/{project.slug}</p> : null}
              </div>
              <span className="text-sm font-medium text-slate">{formatEnvironment(project.environment)}</span>
            </button>
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
