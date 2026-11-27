import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "joi";
import { badRequest } from "../http/responses";

// Validates req.body against a Joi schema before the handler runs.
//   router.post("/", validateBody(createUserSchema), create);
// On success req.body is replaced with Joi's converted value (trimmed, lowercased email, ...), so
// handlers can trust it. On failure: 400 with every problem, not just the first.
//   { "error": "\"email\" must be a valid email", "details": [{ "path": "email", "message": "..." }] }
// Unknown fields are rejected rather than silently dropped.
export const validateBody =
  (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req.body ?? {}, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        path: detail.path.join("."),
        message: detail.message,
      }));
      badRequest(res, error.details[0]?.message ?? error.message, details);
      return;
    }

    req.body = value;
    next();
  };
