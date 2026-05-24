"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { API_URL } from "@/lib/api";
import type { Project } from "@/lib/project-types";
import { currentProject } from "@/lib/projects";

type ProjectContextValue = {
  projects: Project[];
  activeProject: Project;
  activeProjectId: string;
  loading: boolean;
  setActiveProjectId: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);
const activeProjectStorageKey = "laughingwaffle.activeProjectId";

export function getProjectApiBase(project: Project) {
  return project.apiBase ?? `/api/v1/projects/${project.slug ?? project.id}/posts`;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState("");
  const [loading, setLoading] = useState(true);

  function setActiveProjectId(projectId: string) {
    setActiveProjectIdState(projectId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(activeProjectStorageKey, projectId);
    }
  }

  async function refreshProjects() {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        credentials: "include"
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (!Array.isArray(data.projects)) {
        return;
      }

      setProjects(data.projects);

      const storedProjectId = typeof window !== "undefined" ? window.localStorage.getItem(activeProjectStorageKey) : null;
      const nextActiveProjectId = data.projects.some((project: Project) => project.id === storedProjectId)
        ? storedProjectId
        : data.projects[0]?.id ?? "";

      setActiveProjectIdState(nextActiveProjectId);

      if (typeof window !== "undefined") {
        if (nextActiveProjectId) {
          window.localStorage.setItem(activeProjectStorageKey, nextActiveProjectId);
        } else {
          window.localStorage.removeItem(activeProjectStorageKey);
        }
      }
    } catch {
      setProjects([]);
      setActiveProjectIdState("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedProjectId = window.localStorage.getItem(activeProjectStorageKey);

    if (storedProjectId) {
      setActiveProjectIdState(storedProjectId);
    }

    refreshProjects();
  }, []);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? currentProject;
  const contextValue = {
    projects,
    activeProject,
    activeProjectId: projects.length > 0 ? activeProject.id : activeProjectId,
    loading,
    setActiveProjectId,
    refreshProjects
  };
  const isCreateProjectRoute = pathname === "/dashboard/projects/new";

  if (loading) {
    return (
      <ProjectContext.Provider value={contextValue}>
        <div className="grid min-h-screen place-items-center bg-paper px-4 text-center text-ink">
          <div>
            <BrandLogo href="/dashboard" />
            <p className="mt-4 text-sm font-medium text-slate">Loading your workspace...</p>
          </div>
        </div>
      </ProjectContext.Provider>
    );
  }

  if (projects.length === 0 && !isCreateProjectRoute) {
    return (
      <ProjectContext.Provider value={contextValue}>
        <div className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
            <div className="flex h-14 items-center">
              <BrandLogo href="/dashboard" />
            </div>
            <main className="grid flex-1 place-items-center py-12">
              <section className="w-full rounded-lg border border-cloud bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-medium text-slate">No project yet</p>
                <h1 className="mt-2 text-2xl font-semibold text-ink">Create your first project</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate">
                  Projects hold your posts, media, API keys, and public endpoints. Create one before adding content or
                  generating keys.
                </p>
                <Link
                  href="/dashboard/projects/new"
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-white transition hover:bg-[#ef5a49]"
                >
                  Create project
                </Link>
              </section>
            </main>
          </div>
        </div>
      </ProjectContext.Provider>
    );
  }

  return <ProjectContext.Provider value={contextValue}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used inside ProjectProvider.");
  }

  return context;
}
