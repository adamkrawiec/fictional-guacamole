// A user as the API returns it (apps/api/src/users/user.dto.ts)
export type UserDto = {
  id: string;
  name: string;
  email: string;
  // Paths to the user's profile and edit pages, each only when the signed-in user may use it.
  // Link with them as-is; don't build /users/:id yourself, so the API stays the one place that
  // decides.
  showPath?: string;
  editPath?: string;
  // The API endpoint to send DELETE to, only when the signed-in user may delete this user
  deletePath?: string;
};
