import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { validateBody } from "../validation/validate-body";
import { create, destroy, index, me, show, update } from "./user.controller";
import { authorizeUser, loadUser } from "./user.middleware";
import { createUserSchema, updateUserSchema } from "./user.schemas";

// Who may do what: user.policy.ts (admins: everything; users: show/update their own account).
// Order per route: sign-in -> (body) -> load the target user -> policy -> handler.

const usersRouter = Router();

// Any signed-in user: their own account. Before /:id, so "me" isn't read as an id.
usersRouter.get("/me", requireAuth, me);

usersRouter.get("/", requireAuth, authorizeUser("index"), index);
usersRouter.post("/", requireAuth, authorizeUser("create"), validateBody(createUserSchema), create);
usersRouter.get("/:id", requireAuth, loadUser, authorizeUser("show"), show);
usersRouter.patch(
  "/:id",
  requireAuth,
  validateBody(updateUserSchema),
  loadUser,
  authorizeUser("update"),
  update,
);
usersRouter.delete("/:id", requireAuth, loadUser, authorizeUser("destroy"), destroy);

export default usersRouter;
