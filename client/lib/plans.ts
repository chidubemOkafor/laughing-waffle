export type Plan = {
  name: string;
  audience: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  cta: string;
  featured?: boolean;
  limits: Array<{ label: string; value: string }>;
  features: string[];
};

export const plans: Plan[] = [
  {
    name: "Free",
    audience: "For testing an idea",
    price: "$0",
    period: "forever",
    description: "Start publishing structured content and test the API without a card.",
    cta: "Current beta plan",
    limits: [
      { label: "Projects", value: "1" },
      { label: "Posts", value: "25" },
      { label: "API requests", value: "1,000/mo" },
      { label: "Image storage", value: "250 MB" }
    ],
    features: ["Draft and published posts", "Email/password auth", "Create-only API keys", "Basic docs"]
  },
  {
    name: "Starter",
    audience: "For shipping a real content app",
    price: "$9",
    period: "per month",
    description: "More room for projects, posts, images, and production API usage.",
    badge: "Best MVP fit",
    cta: "Upgrade soon",
    featured: true,
    limits: [
      { label: "Projects", value: "5" },
      { label: "Posts", value: "1,000" },
      { label: "API requests", value: "50,000/mo" },
      { label: "Image storage", value: "10 GB" }
    ],
    features: ["Everything in Free", "Multiple projects", "More API keys", "Priority email support"]
  },
  {
    name: "Pro",
    audience: "For teams and higher traffic",
    price: "$29",
    period: "per month",
    description: "Scale content delivery with higher limits and team-ready workflows later.",
    cta: "Talk to us",
    limits: [
      { label: "Projects", value: "25" },
      { label: "Posts", value: "10,000" },
      { label: "API requests", value: "500,000/mo" },
      { label: "Image storage", value: "100 GB" }
    ],
    features: ["Everything in Starter", "Higher API limits", "Advanced usage history", "Team controls later"]
  }
];

export const usageMeters = [
  { label: "Projects", used: 1, limit: 1, detail: "Free plan allows one project." },
  { label: "Posts", used: 0, limit: 25, detail: "Drafts and published posts count together." },
  { label: "API requests", used: 0, limit: 1000, detail: "Monthly public API requests." },
  { label: "Image storage", used: 0, limit: 250, detail: "Cloudinary-backed media allowance in MB." }
];
