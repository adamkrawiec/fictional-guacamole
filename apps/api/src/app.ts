import express from "express";
import { api } from "./api.routes";
import { health } from "./app.controller";
import { authHandler } from "./auth/auth";

const app = express();

// Better Auth parses its own request bodies, so it must be mounted before express.json()
app.all("/api/auth/*splat", authHandler);
app.use(express.json());

app.get("/health", health);
app.use("/api", api);

export default app;
