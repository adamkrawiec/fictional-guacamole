import { Form, Link, NavLink } from "react-router";
import type { SessionData } from "../../auth/session";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "font-semibold text-slate-900 dark:text-slate-100"
    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";

export function SessionButton({ session }: { session: SessionData }) {
  return (
    <div className="ml-auto flex items-center gap-4">
      {session ? (
        <Form method="post" action="/logout" className="flex items-center gap-4">
          <span className="text-slate-500 dark:text-slate-400">{session.user.email}</span>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 font-medium ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </Form>
      ) : (
        <>
          <NavLink to="/register" className={navLinkClass}>
            Register
          </NavLink>
          <Link
            to="/login"
            className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Log in
          </Link>
        </>
      )}
    </div>
  );
}
