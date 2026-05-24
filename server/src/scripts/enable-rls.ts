import { prisma } from "../db.js";

const tables = [
  "User",
  "EmailVerificationCode",
  "PasswordResetToken",
  "Session",
  "Workspace",
  "WorkspaceMember",
  "Project",
  "Post",
  "Media",
  "ApiKey",
  "ApiRequestLog"
];

for (const table of tables) {
  await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
  console.log(`RLS enabled: ${table}`);
}

await prisma.$disconnect();

console.log("\nDone. All tables have RLS enabled.");
