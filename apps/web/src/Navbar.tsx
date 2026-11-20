import { Link, NavLink, useLoaderData } from "react-router";
import type { SessionData } from "./auth/session";
import { SessionButton } from "./components/Navbar/SessionButton";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "font-semibold text-slate-900 dark:text-slate-100"
    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";

export function Navbar() {
  const session = useLoaderData() as SessionData;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6 text-sm">
        <Link to="/" className="text-base font-bold tracking-tight">
          Fictional Guacamole
        </Link>
        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>
        {session && (
          <NavLink to="/users" className={navLinkClass}>
            Users
          </NavLink>
        )}
        <SessionButton session={session} />
      </nav>
    </header>
  );
}
