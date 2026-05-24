"use client";

import { useProjects } from "@/components/dashboard/project-context";

export function ProjectSwitcher() {
  const { projects, activeProjectId, loading, setActiveProjectId } = useProjects();

  if (!loading && projects.length === 0) {
    return (
      <span className="text-sm font-medium text-slate">No project yet</span>
    );
  }

  return (
    <label className="block min-w-0">
      <span className="sr-only">Switch project</span>
      <select
        className="h-9 max-w-[12rem] rounded-lg border border-cloud bg-white px-2 text-sm font-semibold text-ink outline-none transition focus:border-sky focus:ring-2 focus:ring-[rgba(91,141,239,0.12)] sm:max-w-52"
        value={activeProjectId}
        disabled={loading}
        onChange={(event) => setActiveProjectId(event.target.value)}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  );
}
