import { config } from "../config.js";
import { prisma } from "../db.js";
import { sendEmail } from "../email/send-email.js";
import { createToken, hashToken } from "../utils/crypto.js";

export async function createAndSendPasswordReset(user: { id: string; email: string; name: string }) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + config.passwordResetTtlMinutes * 60 * 1000);
  const resetUrl = new URL("/reset-password", config.primaryClientOrigin);
  resetUrl.searchParams.set("token", token);

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  await sendEmail({
    to: user.email,
    subject: "Reset your LaughingWaffle password",
    text: `Hi ${user.name}, reset your LaughingWaffle password here: ${resetUrl.toString()} This link expires in ${config.passwordResetTtlMinutes} minutes.`,
    html: `<p>Hi ${user.name},</p><p>Use the button below to reset your LaughingWaffle password.</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>This link expires in ${config.passwordResetTtlMinutes} minutes.</p>`
  });
}
