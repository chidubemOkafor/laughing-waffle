import bcrypt from "bcryptjs";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { hashToken } from "../utils/crypto.js";

const baseUrl = process.env.AUTH_SMOKE_BASE_URL ?? `http://127.0.0.1:${config.port}`;
const email = `codex-auth-smoke-${Date.now()}@example.test`;
const password = "SmokeTestPassword123!";
const code = "123456";

type Check = {
  name: string;
  passed: boolean;
  status?: number;
  details?: string;
};

const checks: Check[] = [];

function getSessionCookie(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const rawCookie = headers.getSetCookie?.()[0] ?? response.headers.get("set-cookie") ?? "";

  return rawCookie.split(";")[0];
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function expect(
  name: string,
  request: Promise<Response>,
  expectedStatus: number | number[],
  verify?: (body: unknown, response: Response) => boolean | string
) {
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  const response = await request;
  const body = await readJson(response);
  const statusPassed = expectedStatuses.includes(response.status);
  const verifyResult = verify ? verify(body, response) : true;
  const verifyPassed = verifyResult === true;

  checks.push({
    name,
    passed: statusPassed && verifyPassed,
    status: response.status,
    details: verifyPassed ? undefined : String(verifyResult)
  });

  return { response, body };
}

async function main() {
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: "Codex Auth Smoke",
      email,
      passwordHash: await bcrypt.hash(password, 12)
    }
  });

  await prisma.emailVerificationCode.create({
    data: {
      userId: user.id,
      email,
      codeHash: hashToken(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  try {
    await expect(
      "unverified user cannot login",
      fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      }),
      403
    );

    const verified = await expect(
      "email verification creates session and empty workspace",
      fetch(`${baseUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code })
      }),
      201,
      (body, response) => {
        const cookie = getSessionCookie(response);
        const payload = body as { workspace?: unknown; project?: unknown };

        if (!cookie.startsWith(`${config.sessionCookieName}=`)) {
          return "verification did not set the session cookie";
        }

        if (!payload.workspace) {
          return "verification did not create or return a workspace";
        }

        if (payload.project !== null) {
          return "new verified user should not receive a preset project";
        }

        return true;
      }
    );

    const verifiedCookie = getSessionCookie(verified.response);

    await expect(
      "session cookie authenticates /me",
      fetch(`${baseUrl}/api/auth/me`, {
        headers: { cookie: verifiedCookie }
      }),
      200,
      (body) => ((body as { user?: { email?: string } }).user?.email === email ? true : "/me returned the wrong user")
    );

    await expect(
      "logout destroys the active session",
      fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: { cookie: verifiedCookie }
      }),
      204
    );

    await expect(
      "logged out session cannot access /me",
      fetch(`${baseUrl}/api/auth/me`, {
        headers: { cookie: verifiedCookie }
      }),
      401
    );

    const login = await expect(
      "verified user can login",
      fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      }),
      200,
      (_body, response) => {
        const cookie = getSessionCookie(response);

        return cookie.startsWith(`${config.sessionCookieName}=`) || "login did not set the session cookie";
      }
    );

    const loginCookie = getSessionCookie(login.response);

    await expect(
      "login session authenticates /me",
      fetch(`${baseUrl}/api/auth/me`, {
        headers: { cookie: loginCookie }
      }),
      200,
      (body) => ((body as { user?: { email?: string } }).user?.email === email ? true : "/me returned the wrong user")
    );
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }

  const failed = checks.filter((check) => !check.passed);

  console.log(
    JSON.stringify(
      {
        baseUrl,
        passed: failed.length === 0,
        checks
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
