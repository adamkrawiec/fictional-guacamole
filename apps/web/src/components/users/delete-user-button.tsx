import { Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  // The user's deletePath from the API (its DELETE endpoint). Render this only when it was sent.
  endpoint: string;
  // Who is being deleted, for the confirmation, screen readers and the tooltip
  userLabel: string;
  onDeleted: () => void;
  onError: (message: string) => void;
};

// A trash-can button: asks for confirmation, then sends DELETE to the user's endpoint
export function DeleteUserButton({ endpoint, userLabel, onDeleted, onError }: Props) {
  const [deleting, setDeleting] = useState(false);
  const label = `Delete ${userLabel}`;

  async function handleClick() {
    if (!window.confirm(`Delete ${userLabel}? This can't be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        // The API answers { error: "..." }, e.g. "You can't delete your own account"
        const body: { error?: string } = await res.json().catch(() => ({}));
        onError(body.error ?? `Deleting failed (${res.status})`);
        return;
      }
      onDeleted();
    } catch {
      onError("Could not reach the server. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      aria-label={label}
      title={label}
      className="inline-flex rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-300"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );
}
