import { Router } from "express";
import { todoShow, todosIndex } from "./todo.controller";

const todosRouter = Router();

todosRouter.get("/", todosIndex);
todosRouter.get("/:id", todoShow);

export default todosRouter;
