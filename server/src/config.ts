import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const envPath = [resolve(currentDir, "../.env"), resolve(currentDir, "../../.env")].find((path) =>
  existsSync(path)
);

loadEnv(envPath ? { path: envPath } : undefined);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:3000",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "laughingwaffle_session",
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "LaughingWaffle <onboarding@resend.dev>",
  emailSendTimeoutMs: Number(process.env.EMAIL_SEND_TIMEOUT_MS ?? 10000),
  emailVerificationTtlMinutes: Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? 10),
  passwordResetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? ""
};
