import { Pencil } from "lucide-react";
import { Link } from "react-router";

type Props = {
  // The user's editPath from the API. The caller renders this only when the API sent one.
  to: string;
  // Who is being edited, for screen readers and the tooltip ("Edit Ada")
  userLabel: string;
  // Show "Edit" next to the pencil (e.g. on the profile); icon only by default (e.g. in a table)
  withText?: boolean;
};

// A pencil link to a user's edit page
export function EditUserLink({ to, userLabel, withText = false }: Props) {
  const label = `Edit ${userLabel}`;

  return (
    <Link
      to={to}
      aria-label={withText ? undefined : label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded p-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <Pencil className="size-4" aria-hidden="true" />
      {withText && "Edit"}
    </Link>
  );
}
