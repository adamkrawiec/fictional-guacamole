import { Router } from "express";
import * as controller from "./app.controller";
import todosRouter from "./todos/todo.router";
import usersRouter from "./users/user.router";

export const api = Router();

api.get("/", controller.hello);
api.get("/test", controller.test);
api.use("/todos", todosRouter);
api.use("/users", usersRouter);

api.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});
