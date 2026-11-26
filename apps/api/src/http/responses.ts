import type { Response } from "express";

// The API's error responses, in one place so every route answers with the same JSON shape:
//   { "error": "Human-readable message" }
// (plus "details" for validation errors). Use them as `return notFound(res, "User not found");`.

export const badRequest = (res: Response, error: string, details?: unknown) =>
  res.status(400).json(details === undefined ? { error } : { error, details });

export const unauthorized = (res: Response, error = "Unauthorized") =>
  res.status(401).json({ error });

export const forbidden = (res: Response, error = "Forbidden") => res.status(403).json({ error });

export const notFound = (res: Response, error = "Not found") => res.status(404).json({ error });

export const conflict = (res: Response, error: string) => res.status(409).json({ error });
