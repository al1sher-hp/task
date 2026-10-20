import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { formatZodError } from "../utils/validation.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "not found" });
}

// Centralized error handler: never leaks stack traces, always returns { error }.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: formatZodError(err) });
    return;
  }

  if (err instanceof Error && "status" in err && typeof err.status === "number") {
    res.status(err.status).json({ error: err.message || "request failed" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
