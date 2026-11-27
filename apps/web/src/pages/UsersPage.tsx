import { useState } from "react";
import { useRevalidator } from "react-router";
import { useSession } from "../auth/session";
import { UserForm } from "../components/users/user-form";
import { UsersList } from "../components/users/users-list";

export function UsersPage() {
  const session = useSession();
  const revalidator = useRevalidator();
  // Bumped after a save: a new key remounts UsersList, which fetches the list again
  const [listVersion, setListVersion] = useState(0);

  function handleSaved() {
    setListVersion((version) => version + 1);
    revalidator.revalidate(); // reloads the session too, in case the change was to your own account
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      <div className="mt-6">
        <UsersList key={listVersion} />
      </div>

      {session && (
        <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="text-xl font-semibold tracking-tight">Add a user</h2>
          <div className="mt-4">
            <UserForm endpoint="/api/users" method="POST" onSaved={handleSaved} />
          </div>
        </section>
      )}
    </>
  );
}
