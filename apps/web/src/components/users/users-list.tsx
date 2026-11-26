import { useEffect, useState } from "react";
import { Link } from "react-router";
import avatarPlaceholder from "../../assets/avatar-placeholder.jpg";
import { DeleteUserButton } from "./delete-user-button";
import { EditUserLink } from "./edit-user-link";
import type { UserDto } from "./user-dto";

type UsersResponse = {
  users: UserDto[];
};

type State =
  | { status: "loading" }
  | { status: "success"; users: UserDto[] }
  | { status: "error"; error: string };

export function UsersList() {
  const [state, setState] = useState<State>({ status: "loading" });
  // A failed delete, shown above the table (the list itself stays)
  const [actionError, setActionError] = useState<string | null>(null);

  function removeUser(id: string) {
    setActionError(null);
    setState((current) =>
      current.status === "success"
        ? { ...current, users: current.users.filter((user) => user.id !== id) }
        : current,
    );
  }

  useEffect(() => {
    // Cancels the request if the component unmounts (and on React StrictMode's dev double-run)
    const controller = new AbortController();

    // Same-origin request, so the browser sends the session cookie; the endpoint requires sign-in
    fetch("/api/users", { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error("Sign in to see the list of users");
        }
        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }
        const data: UsersResponse = await res.json();
        setState({ status: "success", users: data.users });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <p className="animate-pulse text-slate-500 dark:text-slate-400">Loading users…</p>;
  }

  if (state.status === "error") {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
      >
        Could not load users: {state.error}
      </p>
    );
  }

  if (state.users.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">No users yet.</p>;
  }

  return (
    <>
      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        >
          {actionError}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th scope="col" className="w-12 py-2 pr-3">
              <span className="sr-only">Avatar</span>
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Name
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Email
            </th>
            <th scope="col" className="py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {state.users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 pr-3">
                {/* Everyone gets the placeholder for now. alt="" because the name is right next to
                  it: screen readers would only repeat it. */}
                <img
                  src={avatarPlaceholder}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="size-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              </td>
              <td className="py-2 pr-4">
                {/* A link only when the API says the profile may be opened (showPath) */}
                {user.showPath ? (
                  <Link
                    to={user.showPath}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {user.name || "(no name)"}
                  </Link>
                ) : (
                  user.name || "(no name)"
                )}
              </td>
              <td className="py-2 pr-4">{user.email}</td>
              <td className="py-2 text-right whitespace-nowrap">
                {user.editPath && (
                  <EditUserLink to={user.editPath} userLabel={user.name || user.email} />
                )}
                {user.deletePath && (
                  <DeleteUserButton
                    endpoint={user.deletePath}
                    userLabel={user.name || user.email}
                    onDeleted={() => removeUser(user.id)}
                    onError={setActionError}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
