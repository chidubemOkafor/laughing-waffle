export const planLimits = {
  free: {
    projects: 1,
    posts: 25,
    apiRequests: 1000,
    imageStorageBytes: 250 * 1024 * 1024
  },
  starter: {
    projects: 5,
    posts: 1000,
    apiRequests: 50000,
    imageStorageBytes: 10 * 1024 * 1024 * 1024
  },
  pro: {
    projects: 25,
    posts: 10000,
    apiRequests: 500000,
    imageStorageBytes: 100 * 1024 * 1024 * 1024
  }
} as const;

export type PlanName = keyof typeof planLimits;

export function normalizePlan(plan: string | null | undefined): PlanName {
  return plan === "starter" || plan === "pro" ? plan : "free";
}

export function getBillingPeriodStart() {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
