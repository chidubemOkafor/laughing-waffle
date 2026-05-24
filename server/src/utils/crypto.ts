import crypto from "node:crypto";

export function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function createApiSecret() {
  return crypto.randomBytes(36).toString("base64url");
}

export function createPublicId(length = 12) {
  return crypto.randomBytes(18).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, length);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
