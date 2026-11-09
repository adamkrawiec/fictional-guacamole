import { Router } from "express";
import { todosIndex, todoShow } from "./todo.controller"

const todosRouter = Router();

todosRouter.get("/", todosIndex);
todosRouter.get("/:id", todoShow);

export default todosRouter;