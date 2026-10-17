import { rateLimit } from "express-rate-limit";
import { config } from "../config.js";

function rateLimitHandler(message: string) {
  return (_request: unknown, response: { status: (status: number) => { json: (body: unknown) => unknown } }) =>
    response.status(429).json({ error: { message } });
}

export const apiRateLimiter = rateLimit({
  windowMs: config.apiRateLimitWindowMs,
  limit: config.apiRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many requests. Please try again later.")
});

export const loginRateLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs,
  limit: config.authRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler("Too many sign-in attempts. Please try again later.")
});

export const emailRateLimiter = rateLimit({
  windowMs: config.emailRateLimitWindowMs,
  limit: config.emailRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many email requests. Please try again later.")
});
