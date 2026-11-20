import { Form, Link, NavLink, Outlet, useLoaderData } from "react-router";
import type { SessionData } from "./auth/session";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "font-semibold text-slate-900 dark:text-slate-100"
    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";

// Root layout: a navbar pinned to the top, and every page rendered inside <Outlet /> below it
export function App() {
  const session = useLoaderData() as SessionData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
        </nav>
      </header>

      {/* 3.5rem = the navbar's height (h-14), so the card stays centred in the space below it */}
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
