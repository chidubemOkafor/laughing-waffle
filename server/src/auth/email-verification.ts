import crypto from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { sendEmail } from "../email/send-email.js";
import { hashToken } from "../utils/crypto.js";

export function createVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function createAndSendVerificationCode(user: { id: string; email: string; name: string }) {
  const code = createVerificationCode();
  const expiresAt = new Date(Date.now() + config.emailVerificationTtlMinutes * 60 * 1000);

  await prisma.emailVerificationCode.updateMany({
    where: {
      userId: user.id,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  await prisma.emailVerificationCode.create({
    data: {
      userId: user.id,
      email: user.email,
      codeHash: hashToken(code),
      expiresAt
    }
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your LaughingWaffle account",
    text: `Your LaughingWaffle verification code is ${code}. It expires in ${config.emailVerificationTtlMinutes} minutes.`,
    html: `<p>Your LaughingWaffle verification code is <strong>${code}</strong>.</p><p>It expires in ${config.emailVerificationTtlMinutes} minutes.</p>`
  });
}
