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

  if (err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number") {
    const status = (err as { status: number; message: string }).status;
    const message = (err as { message: string }).message || "request failed";
    res.status(status).json({ error: message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
