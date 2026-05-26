"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
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
  isOwner: boolean;
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
  const router = useRouter();
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
  const isOwner = activeProject?.isOwner !== false;
  const contextValue = {
    projects,
    activeProject,
    activeProjectId: projects.length > 0 ? activeProject.id : activeProjectId,
    isOwner,
    loading,
    setActiveProjectId,
    refreshProjects
  };
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

  if (projects.length === 0) {
    router.replace("/onboarding" as Route);
    return null;
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
