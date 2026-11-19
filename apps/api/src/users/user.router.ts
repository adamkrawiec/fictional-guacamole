import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { index, me } from "./user.controller";

const usersRouter = Router();

usersRouter.get("/", requireAuth, index);
usersRouter.get("/me", requireAuth, me);

export default usersRouter;
