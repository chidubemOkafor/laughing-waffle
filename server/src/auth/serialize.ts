import type { Project, User, Workspace } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt
  };
}

export function serializeWorkspace(workspace: Workspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt
  };
}

export function serializeProject(project: Project) {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    environment: project.environment,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}
