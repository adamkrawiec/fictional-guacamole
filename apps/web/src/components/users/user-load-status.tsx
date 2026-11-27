import type { UserState } from "./use-user";

// The loading and error states of useUser(), shared by the pages that load a user.
// Renders nothing once the user has loaded.
export function UserLoadStatus({ state }: { state: UserState }) {
  if (state.status === "loading") {
    return <p className="animate-pulse text-slate-500 dark:text-slate-400">Loading user…</p>;
  }

  if (state.status === "error") {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
      >
        {state.error}
      </p>
    );
  }

  return null;
}
