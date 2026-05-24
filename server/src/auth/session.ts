import type { Request, Response } from "express";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { createToken, hashToken } from "../utils/crypto.js";

export async function createSession(userId: string, remember = true) {
  const token = createToken();
  const ttlDays = remember ? config.sessionTtlDays : 1;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function getSessionFromRequest(req: Request) {
  const token = req.cookies?.[config.sessionCookieName];

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              workspace: {
                include: {
                  projects: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" }
                  }
                }
              }
            },
            orderBy: { createdAt: "asc" }
          }
        }
      }
    }
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session;
}

export async function deleteSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: { tokenHash: hashToken(token) }
  });
}
