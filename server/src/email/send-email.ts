import { config } from "../config.js";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(input: SendEmailInput) {
  if (!config.resendApiKey) {
    console.log(`[email:dev] To: ${input.to}`);
    console.log(`[email:dev] Subject: ${input.subject}`);
    console.log(input.text);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.emailSendTimeoutMs);
  let response: Response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Unable to send email: request timed out after ${config.emailSendTimeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Unable to send email: ${details || response.statusText}`);
  }
}
