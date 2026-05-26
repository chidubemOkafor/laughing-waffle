export type Project = {
  id: string;
  workspaceId?: string;
  name: string;
  slug?: string;
  description: string | null;
  environment: string;
  isOwner?: boolean;
  apiBase?: string;
  createdAt?: string;
  updatedAt?: string;
};
