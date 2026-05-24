import type { Response } from "express";
import { ZodError } from "zod";

export function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: { message } });
}

export function sendValidationError(res: Response, error: ZodError) {
  return res.status(400).json({
    error: {
      message: "Invalid request body",
      issues: error.issues
    }
  });
}
