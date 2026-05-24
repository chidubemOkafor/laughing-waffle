export type UsageResponse = {
  plan: "free" | "starter" | "pro";
  billingPeriodStart: string;
  usage: {
    projects: { used: number; limit: number };
    posts: { used: number; limit: number };
    apiRequests: { used: number; limit: number };
    imageStorage: { used: number; limit: number; unit: "bytes" };
  };
};

export type UsageMeter = {
  key: keyof UsageResponse["usage"];
  label: string;
  used: number;
  limit: number;
  detail: string;
  unit?: "bytes";
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatUsageValue(value: number, unit?: "bytes") {
  return unit === "bytes" ? formatBytes(value) : value.toLocaleString();
}

export function buildUsageMeters(data: UsageResponse): UsageMeter[] {
  return [
    {
      key: "projects",
      label: "Projects",
      used: data.usage.projects.used,
      limit: data.usage.projects.limit,
      detail: "Workspace projects on this plan."
    },
    {
      key: "posts",
      label: "Posts",
      used: data.usage.posts.used,
      limit: data.usage.posts.limit,
      detail: "Drafts and published posts count together."
    },
    {
      key: "apiRequests",
      label: "API requests",
      used: data.usage.apiRequests.used,
      limit: data.usage.apiRequests.limit,
      detail: "Monthly public API requests with valid API keys."
    },
    {
      key: "imageStorage",
      label: "Image storage",
      used: data.usage.imageStorage.used,
      limit: data.usage.imageStorage.limit,
      detail: "Cloudinary-backed media stored for this project.",
      unit: "bytes"
    }
  ];
}
