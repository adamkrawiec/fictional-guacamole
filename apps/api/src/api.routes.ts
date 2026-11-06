import { Router } from "express";
import * as controller from "./app.controller";

export const api = Router();

api.get("/", controller.hello);
api.get("/test", controller.test);

api.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});
