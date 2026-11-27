import type { AuthSession } from "../auth/auth.middleware";
import type { User } from "../generated/prisma/client";
import { userPolicy } from "./user.policy";

// What the users API returns for a user. Only these fields: role, ban details, verification
// status and timestamps stay on the server.
export type UserDto = {
  id: string;
  name: string;
  email: string;
  // The frontend's pages for this user, each present only if the viewer may use it (user.policy.ts
  // show / update), so the frontend can link to them without knowing the rules.
  showPath?: string;
  editPath?: string;
  // The API endpoint to send DELETE to, present only if the viewer may delete this user
  // (user.policy.ts destroy, and never their own account: the API refuses that).
  deletePath?: string;
};

type Viewer = AuthSession["user"];
type UserFields = Pick<User, "id" | "name" | "email">;

export const userShowPath = (id: string) => `/users/${encodeURIComponent(id)}`;
export const userEditPath = (id: string) => `${userShowPath(id)}/edit`;
export const userDeletePath = (id: string) => `/api${userShowPath(id)}`;

export async function toUserDto(user: UserFields, viewer: Viewer): Promise<UserDto> {
  const dto: UserDto = { id: user.id, name: user.name, email: user.email };
  const [canShow, canEdit, canDelete] = await Promise.all([
    userPolicy.show(viewer, user),
    userPolicy.update(viewer, user),
    userPolicy.destroy(viewer, user),
  ]);
  if (canShow) dto.showPath = userShowPath(user.id);
  if (canEdit) dto.editPath = userEditPath(user.id);
  // Self-deletion is refused in user.controller.ts, so don't offer it
  if (canDelete && user.id !== viewer.id) dto.deletePath = userDeletePath(user.id);
  return dto;
}

export const toUserDtos = (users: UserFields[], viewer: Viewer) =>
  Promise.all(users.map((user) => toUserDto(user, viewer)));
