import { prisma } from "../db.js";

const statements = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "EmailVerificationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "category" TEXT,
    "authorName" TEXT,
    "authorProfilePic" TEXT,
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 1,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "thumbnailMediaId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Post_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "postId" TEXT,
    "usage" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL UNIQUE,
    "hashedSecret" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "scopesJson" TEXT NOT NULL DEFAULT '[]',
    "expiresAt" DATETIME,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ApiRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT,
    "projectId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember" ("workspaceId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "WorkspaceMember_userId_idx" ON "WorkspaceMember" ("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Project_workspaceId_slug_key" ON "Project" ("workspaceId", "slug")`,
  `CREATE INDEX IF NOT EXISTS "Project_workspaceId_idx" ON "Project" ("workspaceId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Post_projectId_slug_key" ON "Post" ("projectId", "slug")`,
  `CREATE INDEX IF NOT EXISTS "Post_projectId_status_idx" ON "Post" ("projectId", "status")`,
  `CREATE INDEX IF NOT EXISTS "Media_projectId_idx" ON "Media" ("projectId")`,
  `CREATE INDEX IF NOT EXISTS "Media_postId_idx" ON "Media" ("postId")`,
  `CREATE INDEX IF NOT EXISTS "ApiKey_projectId_idx" ON "ApiKey" ("projectId")`,
  `CREATE INDEX IF NOT EXISTS "ApiRequestLog_projectId_createdAt_idx" ON "ApiRequestLog" ("projectId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ApiRequestLog_apiKeyId_idx" ON "ApiRequestLog" ("apiKeyId")`,
  `CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId")`
];

async function ensureUserEmailVerifiedColumn() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("User")`);
  const hasColumn = columns.some((column) => column.name === "emailVerifiedAt");

  if (!hasColumn) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME`);
  }
}

async function ensurePostAuthorColumns() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Post")`);
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("authorName")) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN "authorName" TEXT`);
  }

  if (!columnNames.has("authorProfilePic")) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN "authorProfilePic" TEXT`);
  }
}

async function ensurePostReadTimeColumn() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Post")`);
  const hasColumn = columns.some((column) => column.name === "readTimeMinutes");

  if (!hasColumn) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN "readTimeMinutes" INTEGER NOT NULL DEFAULT 1`);
  }
}

async function ensureWorkspacePlanColumn() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Workspace")`);
  const hasColumn = columns.some((column) => column.name === "plan");

  if (!hasColumn) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Workspace" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free'`);
  }
}

async function ensureMediaBytesColumn() {
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("Media")`);
  const hasColumn = columns.some((column) => column.name === "bytes");

  if (!hasColumn) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Media" ADD COLUMN "bytes" INTEGER NOT NULL DEFAULT 0`);
  }
}

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

await ensureUserEmailVerifiedColumn();
await ensurePostAuthorColumns();
await ensurePostReadTimeColumn();
await ensureWorkspacePlanColumn();
await ensureMediaBytesColumn();
await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailVerificationCode_email_idx" ON "EmailVerificationCode" ("email")`);
await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailVerificationCode_userId_idx" ON "EmailVerificationCode" ("userId")`);
await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken" ("userId")`);

await prisma.$disconnect();

console.log("SQLite database is ready.");
