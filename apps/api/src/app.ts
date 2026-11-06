import express from "express";
import { api } from "./api.routes";
import { health } from "./app.controller";

const app = express();

app.use(express.json());

app.get("/health", health);
app.use("/api", api);

export default app;
