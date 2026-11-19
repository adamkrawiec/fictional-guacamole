import { useEffect, useState } from "react";

// The fields of the API's User model this list shows (GET /api/users returns { users: User[] })
type User = {
  id: string;
  name: string;
  email: string;
};

type UsersResponse = {
  users: User[];
};

type State =
  | { status: "loading" }
  | { status: "success"; users: User[] }
  | { status: "error"; error: string };

export function UsersList() {
  const [state, setState] = useState<State>({ status: "loading" });

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
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <tr>
          <th scope="col" className="py-2 pr-4 font-medium">
            Name
          </th>
          <th scope="col" className="py-2 font-medium">
            Email
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {state.users.map((user) => (
          <tr key={user.id}>
            <td className="py-2 pr-4">{user.name}</td>
            <td className="py-2">{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
