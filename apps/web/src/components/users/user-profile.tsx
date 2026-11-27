import { useParams } from "react-router";
import { EditUserLink } from "./edit-user-link";
import { useUser } from "./use-user";
import { UserLoadStatus } from "./user-load-status";

// Shows the name and email of the user in the URL (/users/:id), and an edit link when the API
// says the viewer may edit them (editPath)
export function UserProfile() {
  const { id = "" } = useParams<{ id: string }>();
  const state = useUser(id);

  if (state.status !== "success") {
    return <UserLoadStatus state={state} />;
  }

  const { user } = state;

  return (
    <div className="space-y-4">
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
          <dd className="font-medium">{user.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
      </dl>
      {user.editPath && (
        <EditUserLink to={user.editPath} userLabel={user.name || user.email} withText />
      )}
    </div>
  );
}
