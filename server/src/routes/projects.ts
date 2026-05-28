import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { z } from "zod";
import type { Project } from "@prisma/client";
import { serializeProject } from "../auth/serialize.js";
import { getSessionFromRequest } from "../auth/session.js";
import { getBillingPeriodStart, normalizePlan, planLimits } from "../billing/plans.js";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { createApiSecret, createPublicId, hashToken } from "../utils/crypto.js";
import { calculateReadTimeMinutes, serializeAuthors } from "../utils/content.js";
import { sendError, sendValidationError } from "../utils/http.js";

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().trim().max(280).optional().default(""),
  environment: z.enum(["production", "draft"]).optional().default("production")
});

const dashboardQuerySchema = z.object({
  range: z.enum(["7d", "30d", "all"]).optional().default("7d"),
  status: z.enum(["all", "published", "draft", "review", "scheduled"]).optional().default("all")
});

const postsQuerySchema = z.object({
  status: z.enum(["all", "published", "draft", "review", "scheduled"]).optional().default("all"),
  search: z.string().trim().max(120).optional().default("")
});

const createPostSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  excerpt: z.string().trim().max(500).optional().default(""),
  content: z.string().max(100000).optional().default(""),
  status: z.enum(["draft", "review", "scheduled", "published"]).optional().default("draft"),
  category: z.string().trim().max(80).optional().default(""),
  authorName: z.string().trim().max(120).optional().default(""),
  authorProfilePic: z.string().trim().url().optional().or(z.literal("")).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  publishDate: z.string().trim().optional().default(""),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")).default(""),
  thumbnailAlt: z.string().trim().max(160).optional().default(""),
  seoTitle: z.string().trim().max(160).optional().default(""),
  seoDescription: z.string().trim().max(280).optional().default("")
});

const updatePostSchema = createPostSchema.partial().extend({
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional()
});

const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(80),
  environment: z.enum(["production", "preview", "development"]).optional().default("production"),
  scopes: z
    .array(
      z.enum([
        "content:read",
        "content:create"
      ])
    )
    .min(1)
    .max(1)
    .optional()
    .default(["content:read"]),
  expiresInDays: z.number().int().positive().max(365).optional().default(90)
});

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  width?: number;
  height?: number;
  error?: {
    message?: string;
  };
};

function getPrimaryWorkspace(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>) {
  return session.user.memberships[0]?.workspace;
}

function getRangeStart(range: "7d" | "30d" | "all") {
  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatUpdatedAt(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric"
  }).format(date);
}

function getApiKeyMode(environment: string) {
  return environment === "production" ? "live" : "test";
}

function maskApiKey(prefix: string) {
  return `${prefix}_************`;
}

function serializeApiKey(apiKey: {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  scopesJson: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    maskedKey: maskApiKey(apiKey.prefix),
    environment: apiKey.environment,
    scopes: JSON.parse(apiKey.scopesJson) as string[],
    expiresAt: apiKey.expiresAt,
    lastUsedAt: apiKey.lastUsedAt,
    revokedAt: apiKey.revokedAt,
    createdAt: apiKey.createdAt
  };
}

async function getProjectAccess(
  session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>,
  projectId: string
): Promise<{ project: Project; isOwner: boolean } | null> {
  const workspace = getPrimaryWorkspace(session);

  if (workspace) {
    const ownedProject = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: workspace.id, deletedAt: null }
    });
    if (ownedProject) return { project: ownedProject, isOwner: true };
  }

  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
    include: { project: true }
  });

  if (membership && !membership.project.deletedAt) {
    return { project: membership.project, isOwner: false };
  }

  return null;
}

async function generateUniqueApiKey(environment: string) {
  const mode = getApiKeyMode(environment);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = createPublicId(12);
    const secret = createApiSecret();
    const prefix = `lw_${mode}_${publicId}`;
    const key = `${prefix}_${secret}`;
    const existingKey = await prisma.apiKey.findUnique({
      where: { prefix }
    });

    if (!existingKey) {
      return { key, prefix };
    }
  }

  throw new Error("Unable to generate a unique API key.");
}

export const projectsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function serializePost(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  category: string | null;
  authorName: string | null;
  authorProfilePic: string | null;
  readTimeMinutes: number;
  tagsJson: string;
  thumbnailMediaId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status: titleCase(post.status),
    category: post.category,
    authors: serializeAuthors(post),
    readTimeMinutes: post.readTimeMinutes,
    tags: JSON.parse(post.tagsJson) as string[],
    thumbnailMediaId: post.thumbnailMediaId,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    updated: formatUpdatedAt(post.updatedAt)
  };
}

async function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${config.cloudinaryApiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");
  const formData = new FormData();

  formData.set("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
  formData.set("api_key", config.cloudinaryApiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("folder", folder);
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to upload image to Cloudinary.");
  }

  if (!data?.secure_url || !data.public_id) {
    throw new Error("Cloudinary did not return an uploaded image URL.");
  }

  return {
    url: data.secure_url,
    path: data.public_id,
    bytes: typeof data.bytes === "number" ? data.bytes : file.size,
    width: typeof data.width === "number" ? data.width : null,
    height: typeof data.height === "number" ? data.height : null
  };
}

projectsRouter.get("/", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const workspace = getPrimaryWorkspace(session);

  if (!workspace) {
    return sendError(res, 404, "No workspace found for this account.");
  }

  const [ownedProjects, memberships] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      orderBy: { createdAt: "asc" }
    }),
    prisma.projectMember.findMany({
      where: { userId: session.user.id },
      include: { project: true }
    })
  ]);

  const memberProjects = memberships
    .filter((m) => !m.project.deletedAt && m.project.workspaceId !== workspace.id)
    .map((m) => m.project);

  return res.json({
    workspaceId: workspace.id,
    projects: [
      ...ownedProjects.map((p) => ({ ...serializeProject(p), isOwner: true })),
      ...memberProjects.map((p) => ({ ...serializeProject(p), isOwner: false }))
    ]
  });
});

projectsRouter.get("/:projectId/dashboard", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const parsed = dashboardQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const rangeStart = getRangeStart(parsed.data.range);
  const rangeCreatedAt = rangeStart ? { gte: rangeStart } : undefined;
  const statusFilter = parsed.data.status === "all" ? undefined : parsed.data.status;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    publishedPosts,
    publishedPostsInRange,
    drafts,
    reviewPending,
    scheduled,
    publishedToday,
    apiRequests,
    activeKeys,
    expiringKeys,
    recentPosts
  ] = await Promise.all([
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: "published"
      }
    }),
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: "published",
        publishedAt: rangeCreatedAt
      }
    }),
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: "draft"
      }
    }),
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: "review"
      }
    }),
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: "scheduled"
      }
    }),
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null,
        status: "published",
        publishedAt: {
          gte: todayStart
        }
      }
    }),
    prisma.apiRequestLog.count({
      where: {
        projectId: project.id,
        createdAt: rangeCreatedAt
      }
    }),
    prisma.apiKey.count({
      where: {
        projectId: project.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    }),
    prisma.apiKey.count({
      where: {
        projectId: project.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.post.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
        ...(statusFilter ? { status: statusFilter } : {})
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    })
  ]);

  return res.json({
    project: serializeProject(project),
    range: parsed.data.range,
    status: parsed.data.status,
    metrics: [
      {
        label: "Published posts",
        value: publishedPosts,
        detail: parsed.data.range === "all" ? "All time" : `+${publishedPostsInRange} in selected range`
      },
      {
        label: "Drafts",
        value: drafts,
        detail: `${reviewPending} ready for review`
      },
      {
        label: "API requests",
        value: apiRequests,
        detail: parsed.data.range === "all" ? "All time requests" : "In selected range"
      },
      {
        label: "Active keys",
        value: activeKeys,
        detail: `${expiringKeys} expire within 30 days`
      }
    ],
    recentPosts: recentPosts.map((post) => ({
      id: post.id,
      title: post.title,
      status: titleCase(post.status),
      category: post.category,
      updated: formatUpdatedAt(post.updatedAt)
    })),
    queue: [
      { label: "Review pending", value: reviewPending, color: "bg-amber" },
      { label: "Scheduled", value: scheduled, color: "bg-sky" },
      { label: "Published today", value: publishedToday, color: "bg-teal" }
    ]
  });
});

projectsRouter.get("/:projectId/usage", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const workspace = getPrimaryWorkspace(session);

  if (!workspace) {
    return sendError(res, 404, "No workspace found for this account.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;
  const plan = normalizePlan(workspace.plan);
  const limits = planLimits[plan];
  const billingPeriodStart = getBillingPeriodStart();

  const [projects, posts, apiRequests, imageStorage] = await Promise.all([
    prisma.project.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    }),
    prisma.post.count({
      where: {
        projectId: project.id,
        deletedAt: null
      }
    }),
    prisma.apiRequestLog.count({
      where: {
        projectId: project.id,
        createdAt: {
          gte: billingPeriodStart
        }
      }
    }),
    prisma.media.aggregate({
      where: {
        projectId: project.id,
        deletedAt: null
      },
      _sum: {
        bytes: true
      }
    })
  ]);

  return res.json({
    project: serializeProject(project),
    plan,
    billingPeriodStart,
    usage: {
      projects: {
        used: projects,
        limit: limits.projects
      },
      posts: {
        used: posts,
        limit: limits.posts
      },
      apiRequests: {
        used: apiRequests,
        limit: limits.apiRequests
      },
      imageStorage: {
        used: imageStorage._sum.bytes ?? 0,
        limit: limits.imageStorageBytes,
        unit: "bytes"
      }
    }
  });
});

projectsRouter.get("/:projectId/posts", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const parsed = postsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const statusFilter = parsed.data.status === "all" ? undefined : parsed.data.status;
  const search = parsed.data.search.toLowerCase();
  const posts = await prisma.post.findMany({
    where: {
      projectId: project.id,
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter } : {})
    },
    orderBy: { updatedAt: "desc" },
    take: 50
  });
  const filteredPosts = search
    ? posts.filter((post) => {
        const values = [post.title, post.slug, post.excerpt ?? "", post.category ?? ""];
        return values.some((value) => value.toLowerCase().includes(search));
      })
    : posts;
  const thumbnailIds = filteredPosts
    .map((post) => post.thumbnailMediaId)
    .filter((thumbnailId): thumbnailId is string => Boolean(thumbnailId));
  const thumbnails = thumbnailIds.length
    ? await prisma.media.findMany({
        where: {
          id: { in: thumbnailIds },
          projectId: project.id,
          deletedAt: null
        }
      })
    : [];
  const thumbnailsById = new Map(thumbnails.map((thumbnail) => [thumbnail.id, thumbnail]));

  return res.json({
    project: serializeProject(project),
    posts: filteredPosts.map((post) => {
      const thumbnail = post.thumbnailMediaId ? thumbnailsById.get(post.thumbnailMediaId) : null;

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        status: titleCase(post.status),
        category: post.category,
        authors: serializeAuthors(post),
        readTimeMinutes: post.readTimeMinutes,
        updated: formatUpdatedAt(post.updatedAt),
        updatedAt: post.updatedAt,
        publishedAt: post.publishedAt,
        thumbnail: thumbnail
          ? {
              url: thumbnail.url,
              alt: thumbnail.alt
            }
          : null
      };
    })
  });
});

projectsRouter.get("/:projectId/posts/:postId", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const post = await prisma.post.findFirst({
    where: {
      id: req.params.postId,
      projectId: project.id,
      deletedAt: null
    }
  });

  if (!post) {
    return sendError(res, 404, "Post not found.");
  }

  const thumbnail = post.thumbnailMediaId
    ? await prisma.media.findFirst({
        where: {
          id: post.thumbnailMediaId,
          projectId: project.id,
          deletedAt: null
        }
      })
    : null;

  return res.json({
    project: serializeProject(project),
    post: {
      ...serializePost(post),
      thumbnail: thumbnail
        ? {
            url: thumbnail.url,
            alt: thumbnail.alt,
            width: thumbnail.width,
            height: thumbnail.height
          }
        : null
    }
  });
});

projectsRouter.post("/:projectId/posts", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const parsed = createPostSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const existingPost = await prisma.post.findFirst({
    where: {
      projectId: project.id,
      slug: parsed.data.slug,
      deletedAt: null
    }
  });

  if (existingPost) {
    return sendError(res, 409, "A post with this slug already exists in this project.");
  }

  const publishDate = parsed.data.publishDate ? new Date(parsed.data.publishDate) : null;

  if (publishDate && Number.isNaN(publishDate.getTime())) {
    return sendError(res, 400, "Publish date is invalid.");
  }

  const publishedAt =
    parsed.data.status === "published" ? publishDate ?? new Date() : parsed.data.status === "scheduled" ? publishDate : null;

  if (parsed.data.status === "scheduled" && !publishedAt) {
    return sendError(res, 400, "Scheduled posts need a publish date.");
  }

  const post = await prisma.$transaction(async (tx) => {
    const readTimeMinutes = calculateReadTimeMinutes(parsed.data.content);
    const createdPost = await tx.post.create({
      data: {
        projectId: project.id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        status: parsed.data.status,
        category: parsed.data.category || null,
        authorName: parsed.data.authorName || null,
        authorProfilePic: parsed.data.authorProfilePic || null,
        readTimeMinutes,
        tagsJson: JSON.stringify(parsed.data.tags),
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        publishedAt
      }
    });

    if (!parsed.data.thumbnailUrl) {
      return createdPost;
    }

    const thumbnail = await tx.media.create({
      data: {
        projectId: project.id,
        postId: createdPost.id,
        usage: "thumbnail",
        url: parsed.data.thumbnailUrl,
        path: parsed.data.thumbnailUrl,
        alt: parsed.data.thumbnailAlt || parsed.data.title,
        bytes: 0
      }
    });

    return tx.post.update({
      where: { id: createdPost.id },
      data: { thumbnailMediaId: thumbnail.id }
    });
  });

  return res.status(201).json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: titleCase(post.status),
      category: post.category,
      authors: serializeAuthors(post),
      readTimeMinutes: post.readTimeMinutes,
      updated: formatUpdatedAt(post.updatedAt),
      publishedAt: post.publishedAt
    }
  });
});

projectsRouter.patch("/:projectId/posts/:postId", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const existingPost = await prisma.post.findFirst({
    where: {
      id: req.params.postId,
      projectId: project.id,
      deletedAt: null
    }
  });

  if (!existingPost) {
    return sendError(res, 404, "Post not found.");
  }

  const parsed = updatePostSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  if (parsed.data.slug && parsed.data.slug !== existingPost.slug) {
    const slugConflict = await prisma.post.findFirst({
      where: {
        projectId: project.id,
        slug: parsed.data.slug,
        deletedAt: null
      }
    });

    if (slugConflict) {
      return sendError(res, 409, "A post with this slug already exists in this project.");
    }
  }

  const publishDate = parsed.data.publishDate ? new Date(parsed.data.publishDate) : null;

  if (publishDate && Number.isNaN(publishDate.getTime())) {
    return sendError(res, 400, "Publish date is invalid.");
  }

  const nextStatus = parsed.data.status ?? existingPost.status;
  const publishedAt =
    nextStatus === "published"
      ? publishDate ?? existingPost.publishedAt ?? new Date()
      : nextStatus === "scheduled"
        ? publishDate ?? existingPost.publishedAt
        : null;

  if (nextStatus === "scheduled" && !publishedAt) {
    return sendError(res, 400, "Scheduled posts need a publish date.");
  }

  let thumbnailMediaId = existingPost.thumbnailMediaId;

  if (parsed.data.thumbnailUrl !== undefined) {
    if (!parsed.data.thumbnailUrl) {
      thumbnailMediaId = null;
    } else {
      const existingThumb = thumbnailMediaId
        ? await prisma.media.findFirst({ where: { id: thumbnailMediaId, deletedAt: null } })
        : null;

      if (existingThumb?.url !== parsed.data.thumbnailUrl) {
        const thumb = await prisma.media.create({
          data: {
            projectId: project.id,
            postId: existingPost.id,
            usage: "thumbnail",
            url: parsed.data.thumbnailUrl,
            path: parsed.data.thumbnailUrl,
            alt: parsed.data.thumbnailAlt || parsed.data.title || existingPost.title,
            bytes: 0
          }
        });
        thumbnailMediaId = thumb.id;
      } else if (parsed.data.thumbnailAlt && existingThumb) {
        await prisma.media.update({
          where: { id: existingThumb.id },
          data: { alt: parsed.data.thumbnailAlt }
        });
      }
    }
  }

  const post = await prisma.post.update({
    where: { id: existingPost.id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt === undefined ? undefined : parsed.data.excerpt || null,
      content: parsed.data.content,
      readTimeMinutes: parsed.data.content === undefined ? undefined : calculateReadTimeMinutes(parsed.data.content),
      status: parsed.data.status,
      category: parsed.data.category === undefined ? undefined : parsed.data.category || null,
      authorName: parsed.data.authorName === undefined ? undefined : parsed.data.authorName || null,
      authorProfilePic: parsed.data.authorProfilePic === undefined ? undefined : parsed.data.authorProfilePic || null,
      tagsJson: parsed.data.tags ? JSON.stringify(parsed.data.tags) : undefined,
      seoTitle: parsed.data.seoTitle === undefined ? undefined : parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription === undefined ? undefined : parsed.data.seoDescription || null,
      publishedAt,
      thumbnailMediaId
    }
  });

  return res.json({ post: serializePost(post) });
});

projectsRouter.delete("/:projectId/posts/:postId", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const post = await prisma.post.findFirst({
    where: {
      id: req.params.postId,
      projectId: project.id,
      deletedAt: null
    }
  });

  if (!post) {
    return sendError(res, 404, "Post not found.");
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { deletedAt: new Date() }
  });

  return res.status(204).send();
});

projectsRouter.post("/:projectId/media", upload.single("file"), async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, String(req.params.projectId));

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  if (!req.file) {
    return sendError(res, 400, "No image file uploaded.");
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return sendError(res, 400, "Only image uploads are supported.");
  }

  try {
    const uploaded = await uploadToCloudinary(req.file, `laughingwaffle/${project.slug}`);
    const media = await prisma.media.create({
      data: {
        projectId: project.id,
        usage: String(req.body.usage ?? "post-image"),
        url: uploaded.url,
        path: uploaded.path,
        alt: req.body.alt ? String(req.body.alt) : null,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height
      }
    });

    return res.status(201).json({
      media: {
        id: media.id,
        url: media.url,
        alt: media.alt,
        width: media.width,
        height: media.height
      }
    });
  } catch (error) {
    return sendError(res, 500, error instanceof Error ? error.message : "Unable to upload image.");
  }
});

projectsRouter.get("/:projectId/api-keys", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const apiKeys = await prisma.apiKey.findMany({
    where: {
      projectId: project.id,
      revokedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({
    project: serializeProject(project),
    apiKeys: apiKeys.map(serializeApiKey)
  });
});

projectsRouter.post("/:projectId/api-keys", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const { project } = access;

  const parsed = createApiKeySchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const { key, prefix } = await generateUniqueApiKey(parsed.data.environment);
  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      prefix,
      hashedSecret: hashToken(key),
      environment: parsed.data.environment,
      scopesJson: JSON.stringify(parsed.data.scopes),
      expiresAt
    }
  });

  return res.status(201).json({
    apiKey: serializeApiKey(apiKey),
    secret: key
  });
});

projectsRouter.delete("/:projectId/api-keys/:apiKeyId", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  if (!access.isOwner) {
    return sendError(res, 403, "Only project owners can revoke API keys.");
  }

  const { project } = access;

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: req.params.apiKeyId,
      projectId: project.id,
      revokedAt: null
    }
  });

  if (!apiKey) {
    return sendError(res, 404, "API key not found.");
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { revokedAt: new Date() }
  });

  return res.status(204).send();
});

projectsRouter.post("/", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const parsed = createProjectSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const workspace = getPrimaryWorkspace(session);

  if (!workspace) {
    return sendError(res, 404, "No workspace found for this account.");
  }

  const existingProject = await prisma.project.findFirst({
    where: {
      workspaceId: workspace.id,
      slug: parsed.data.slug,
      deletedAt: null
    }
  });

  if (existingProject) {
    return sendError(res, 409, "A project with this slug already exists.");
  }

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      environment: parsed.data.environment
    }
  });

  return res.status(201).json({
    project: serializeProject(project)
  });
});

const addMemberSchema = z.object({
  email: z.string().trim().email()
});

projectsRouter.get("/:projectId/members", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: access.project.id },
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });

  return res.json({
    project: serializeProject(access.project),
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      createdAt: m.createdAt
    }))
  });
});

projectsRouter.post("/:projectId/members", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  if (!access.isOwner) {
    return sendError(res, 403, "Only project owners can add members.");
  }

  const parsed = addMemberSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const { email } = parsed.data;
  const targetUser = await prisma.user.findUnique({ where: { email } });

  if (!targetUser) {
    return sendError(res, 404, "No account found with that email address.");
  }

  if (targetUser.id === session.user.id) {
    return sendError(res, 400, "You cannot add yourself as a member.");
  }

  const existing = await prisma.projectMember.findFirst({
    where: { projectId: access.project.id, userId: targetUser.id }
  });

  if (existing) {
    return sendError(res, 409, "This user is already a member of this project.");
  }

  const member = await prisma.projectMember.create({
    data: { projectId: access.project.id, userId: targetUser.id, role: "editor" },
    include: { user: true }
  });

  return res.status(201).json({
    member: {
      id: member.id,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      createdAt: member.createdAt
    }
  });
});

projectsRouter.delete("/:projectId/members/:memberId", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  if (!access.isOwner) {
    return sendError(res, 403, "Only project owners can remove members.");
  }

  const member = await prisma.projectMember.findFirst({
    where: { id: req.params.memberId, projectId: access.project.id }
  });

  if (!member) {
    return sendError(res, 404, "Member not found.");
  }

  await prisma.projectMember.delete({ where: { id: member.id } });

  return res.status(204).send();
});

projectsRouter.delete("/:projectId", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const access = await getProjectAccess(session, req.params.projectId);

  if (!access) {
    return sendError(res, 404, "Project not found.");
  }

  if (!access.isOwner) {
    return sendError(res, 403, "Only project owners can delete a project.");
  }

  await prisma.project.update({
    where: { id: access.project.id },
    data: { deletedAt: new Date() }
  });

  return res.status(204).send();
});
