import type { Project } from "@/lib/project-types";

export const projects: Project[] = [
  {
    id: "laughingwaffle-blog",
    name: "LaughingWaffle Blog",
    description: "Primary marketing and product blog",
    environment: "Production",
    apiBase: "/api/v1/public/posts"
  },
  {
    id: "docs-hub",
    name: "Docs Hub",
    description: "Developer guides and API documentation",
    environment: "Draft",
    apiBase: "/api/v1/public/docs"
  },
  {
    id: "changelog",
    name: "Changelog",
    description: "Product release notes and updates",
    environment: "Production",
    apiBase: "/api/v1/public/changelog"
  }
];

export const currentProject = projects[0];
