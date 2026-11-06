import express from "express";
import { health } from "./app.controller";
import { api } from "./api.routes";

const app = express();

app.use(express.json());

app.get("/health", health);
app.use("/api", api);

export default app;
