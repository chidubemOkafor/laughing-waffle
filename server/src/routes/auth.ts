import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { serializeProject, serializeUser, serializeWorkspace } from "../auth/serialize.js";
import { createAndSendVerificationCode } from "../auth/email-verification.js";
import { createAndSendPasswordReset } from "../auth/password-reset.js";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionFromRequest,
  setSessionCookie
} from "../auth/session.js";
import { sendError, sendValidationError } from "../utils/http.js";
import { hashToken } from "../utils/crypto.js";

const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
  remember: z.boolean().optional().default(true)
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  code: z.string().trim().regex(/^\d{6}$/)
});

const resendVerificationSchema = z.object({
  email: z.string().trim().email().toLowerCase()
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase()
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8)
});

async function getOrCreateWorkspace(user: { id: string; name: string }) {
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          projects: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" }
          }
        }
      }
    }
  });

  if (existingMembership) {
    return {
      workspace: existingMembership.workspace,
      project: existingMembership.workspace.projects[0] ?? null
    };
  }

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: `${user.name}'s Workspace` }
    });

    await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "owner"
      }
    });

    return { workspace, project: null };
  });
}

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (existingUser?.emailVerifiedAt) {
    return sendError(res, 409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: parsed.data.name,
          passwordHash
        }
      })
    : await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash
        }
      });

  await createAndSendVerificationCode(user);

  return res.status(201).json({
    verificationRequired: true,
    email: user.email
  });
});

authRouter.post("/verify-email", async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user) {
    return sendError(res, 404, "No account exists for this email.");
  }

  if (user.emailVerifiedAt) {
    const { workspace, project } = await getOrCreateWorkspace(user);
    const session = await createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);

    return res.json({
      user: serializeUser(user),
      workspace: serializeWorkspace(workspace),
      project: project ? serializeProject(project) : null
    });
  }

  const verification = await prisma.emailVerificationCode.findFirst({
    where: {
      userId: user.id,
      email: parsed.data.email,
      codeHash: hashToken(parsed.data.code),
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!verification) {
    return sendError(res, 400, "Invalid or expired verification code.");
  }

  const verifiedUser = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationCode.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() }
    });

    return tx.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() }
    });
  });

  const { workspace, project } = await getOrCreateWorkspace(verifiedUser);
  const session = await createSession(verifiedUser.id);
  setSessionCookie(res, session.token, session.expiresAt);

  return res.status(201).json({
    user: serializeUser(verifiedUser),
    workspace: serializeWorkspace(workspace),
    project: project ? serializeProject(project) : null
  });
});

authRouter.post("/resend-verification-code", async (req, res) => {
  const parsed = resendVerificationSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const response = {
    verificationRequired: true,
    email: parsed.data.email,
    message: "If an unverified account exists for this email, a new verification code has been sent."
  };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user || user.emailVerifiedAt) {
    return res.json(response);
  }

  await createAndSendVerificationCode(user);

  return res.json(response);
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user) {
    return sendError(res, 401, "Invalid email or password.");
  }

  const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!validPassword) {
    return sendError(res, 401, "Invalid email or password.");
  }

  if (!user.emailVerifiedAt) {
    return sendError(res, 403, "Please verify your email before signing in.");
  }

  const session = await createSession(user.id, parsed.data.remember);
  setSessionCookie(res, session.token, session.expiresAt);

  return res.json({
    user: serializeUser(user)
  });
});

authRouter.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (user) {
    await createAndSendPasswordReset(user);
  }

  return res.json({
    message: "If an account exists for that email, a password reset link has been sent."
  });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(parsed.data.token),
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!resetToken) {
    return sendError(res, 400, "Invalid or expired reset link.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { consumedAt: new Date() }
    });

    await tx.session.deleteMany({
      where: { userId: resetToken.userId }
    });
  });

  clearSessionCookie(res);

  return res.json({
    message: "Password reset successfully."
  });
});

authRouter.post("/logout", async (req, res) => {
  await deleteSession(req.cookies?.[config.sessionCookieName]);
  clearSessionCookie(res);

  return res.status(204).send();
});

authRouter.get("/me", async (req, res) => {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return sendError(res, 401, "Not authenticated.");
  }

  const membership = session.user.memberships[0];
  const workspace = membership?.workspace;
  const project = workspace?.projects[0];

  return res.json({
    user: serializeUser(session.user),
    workspace: workspace ? serializeWorkspace(workspace) : null,
    project: project ? serializeProject(project) : null
  });
});
