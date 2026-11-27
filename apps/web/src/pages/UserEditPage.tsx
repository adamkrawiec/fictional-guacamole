import { Link, useParams } from "react-router";
import { useUser } from "../components/users/use-user";
import { UserForm } from "../components/users/user-form";
import { UserLoadStatus } from "../components/users/user-load-status";

// /users/:id/edit: the user form, filled in with the user from the URL, saving with
// PATCH /api/users/:id. The API decides who may edit whom (admins: anyone, users: themselves).
export function UserEditPage() {
  const { id = "" } = useParams<{ id: string }>();
  const state = useUser(id);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Edit user</h1>
      <div className="mt-6">
        {state.status === "success" ? (
          <>
            {/* key: start over with fresh values if the URL switches to another user */}
            <UserForm
              key={state.user.id}
              endpoint={`/api/users/${encodeURIComponent(state.user.id)}`}
              method="PATCH"
              initialValues={{ name: state.user.name, email: state.user.email }}
            />
            {state.user.showPath && (
              <p className="mt-4 text-sm">
                <Link to={state.user.showPath} className="underline">
                  Back to profile
                </Link>
              </p>
            )}
          </>
        ) : (
          <UserLoadStatus state={state} />
        )}
      </div>
    </>
  );
}
