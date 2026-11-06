import express, { Router } from "express";
import * as controller from "./app.controller";

export const api = Router();

// Middleware registered here only runs for /api/* requests
api.use(express.json());

api.get("/", controller.hello);     // GET /api
api.get("/test", controller.test);  // GET /api/test
// future: api.use("/todos", todosRouter);  → /api/todos/...

// Unknown /api/* paths return a JSON 404 instead of falling through
api.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});
