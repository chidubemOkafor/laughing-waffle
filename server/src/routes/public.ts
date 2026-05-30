import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { calculateReadTimeMinutes, serializeAuthors } from "../utils/content.js";
import { hashToken } from "../utils/crypto.js";
import { sendError, sendValidationError } from "../utils/http.js";

const publicPostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  tag: z.string().trim().max(40).optional().default("")
});

const createPublicPostSchema = z.object({
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
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  userProfile: z
    .object({
      fullName: z.string().trim().min(1).max(120),
      profilePic: z.string().trim().url().optional()
    })
    .optional()
});

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

async function getApiKeyForProject(token: string, projectSlug: string) {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      hashedSecret: hashToken(token),
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    include: { project: true }
  });

  if (!apiKey || apiKey.project.deletedAt) {
    return null;
  }

  if (apiKey.project.slug !== projectSlug) {
    return null;
  }

  return apiKey;
}

function parseScopes(scopesJson: string) {
  return JSON.parse(scopesJson) as string[];
}

function trackApiRequest(req: Request, res: Response, apiKey: NonNullable<Awaited<ReturnType<typeof getApiKeyForProject>>>) {
  res.once("finish", () => {
    void prisma.apiRequestLog
      .create({
        data: {
          apiKeyId: apiKey.id,
          projectId: apiKey.projectId,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode
        }
      })
      .catch((error) => {
        console.error("Unable to record API request usage.", error);
      });

    void prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      })
      .catch((error) => {
        console.error("Unable to update API key usage.", error);
      });
  });
}

async function getReadOnlyApiKey(req: Request, res: Response) {
  const token = getBearerToken(req.header("authorization"));

  if (!token) {
    sendError(res, 401, "Invalid or missing API key.");
    return null;
  }

  const apiKey = await getApiKeyForProject(token, String(req.params.projectSlug));

  if (!apiKey) {
    sendError(res, 401, "Invalid or missing API key.");
    return null;
  }

  const scopes = parseScopes(apiKey.scopesJson);

  if (scopes.length !== 1 || scopes[0] !== "content:read") {
    sendError(res, 403, "This endpoint requires a read-only API key.");
    return null;
  }

  trackApiRequest(req, res, apiKey);

  return apiKey;
}

export const publicRouter = Router();

publicRouter.use((req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }
  next();
});

publicRouter.get("/v1/projects/:projectSlug/posts", async (req, res) => {
  const apiKey = await getReadOnlyApiKey(req, res);

  if (!apiKey) {
    return;
  }

  const parsed = publicPostsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const skip = (parsed.data.page - 1) * parsed.data.limit;
  const posts = await prisma.post.findMany({
    where: {
      projectId: apiKey.projectId,
      deletedAt: null,
      status: "published"
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      tagsJson: true,
      publishedAt: true,
      updatedAt: true,
      authorName: true,
      authorProfilePic: true,
      readTimeMinutes: true,
      thumbnailMediaId: true
    },
    orderBy: { publishedAt: "desc" },
    skip,
    take: parsed.data.limit
  });
  const filteredPosts = parsed.data.tag
    ? posts.filter((post) => (JSON.parse(post.tagsJson) as string[]).includes(parsed.data.tag))
    : posts;

  const thumbnailIds = filteredPosts.map((p) => p.thumbnailMediaId).filter(Boolean) as string[];
  const thumbnails = thumbnailIds.length > 0
    ? await prisma.media.findMany({ where: { id: { in: thumbnailIds }, deletedAt: null }, select: { id: true, url: true, alt: true } })
    : [];
  const thumbnailMap = new Map(thumbnails.map((t) => [t.id, t]));

  return res.json({
    data: filteredPosts.map((post) => {
      const thumb = post.thumbnailMediaId ? thumbnailMap.get(post.thumbnailMediaId) : null;
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        tags: JSON.parse(post.tagsJson) as string[],
        thumbnail: thumb ? { url: thumb.url, alt: thumb.alt } : null,
        authors: serializeAuthors(post),
        readTimeMinutes: post.readTimeMinutes,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt
      };
    }),
    pagination: {
      page: parsed.data.page,
      limit: parsed.data.limit
    }
  });
});

publicRouter.get("/v1/projects/:projectSlug/posts/:postSlug", async (req, res) => {
  const apiKey = await getReadOnlyApiKey(req, res);

  if (!apiKey) {
    return;
  }

  const post = await prisma.post.findFirst({
    where: {
      projectId: apiKey.projectId,
      slug: String(req.params.postSlug),
      deletedAt: null,
      status: "published"
    }
  });

  if (!post) {
    return sendError(res, 404, "Post not found.");
  }

  const thumbnail = post.thumbnailMediaId
    ? await prisma.media.findFirst({ where: { id: post.thumbnailMediaId, deletedAt: null }, select: { url: true, alt: true } })
    : null;

  return res.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: JSON.parse(post.tagsJson) as string[],
      thumbnail: thumbnail ? { url: thumbnail.url, alt: thumbnail.alt } : null,
      authors: serializeAuthors(post),
      readTimeMinutes: post.readTimeMinutes,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt
    }
  });
});

publicRouter.post("/v1/projects/:projectSlug/posts", async (req, res) => {
  const token = getBearerToken(req.header("authorization"));

  if (!token) {
    return sendError(res, 401, "Invalid or missing API key.");
  }

  const apiKey = await getApiKeyForProject(token, String(req.params.projectSlug));

  if (!apiKey) {
    return sendError(res, 401, "Invalid or missing API key.");
  }

  trackApiRequest(req, res, apiKey);

  const scopes = parseScopes(apiKey.scopesJson);

  if (scopes.length !== 1 || scopes[0] !== "content:create") {
    return sendError(res, 403, "This endpoint requires a create-only API key.");
  }

  const parsed = createPublicPostSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const existingPost = await prisma.post.findFirst({
    where: {
      projectId: apiKey.projectId,
      slug: parsed.data.slug,
      deletedAt: null
    }
  });

  if (existingPost) {
    return sendError(res, 409, "A post with this slug already exists in this project.");
  }

  const post = await prisma.post.create({
    data: {
      projectId: apiKey.projectId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      status: parsed.data.status,
      category: parsed.data.category || null,
      authorName: parsed.data.userProfile?.fullName ?? null,
      authorProfilePic: parsed.data.userProfile?.profilePic ?? null,
      readTimeMinutes: calculateReadTimeMinutes(parsed.data.content),
      tagsJson: JSON.stringify(parsed.data.tags),
      publishedAt: parsed.data.status === "published" ? new Date() : null
    }
  });

  return res.status(201).json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      authors: serializeAuthors(post),
      readTimeMinutes: post.readTimeMinutes,
      userProfile: post.authorName
        ? {
            fullName: post.authorName,
            profilePic: post.authorProfilePic
          }
        : null,
      createdAt: post.createdAt
    }
  });
});
