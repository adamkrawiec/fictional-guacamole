import { NavLink, Outlet } from "react-router";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-semibold" : "text-slate-500 hover:underline dark:text-slate-400";

// Root layout: every page renders inside <Outlet />
export function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <nav className="mb-6 flex gap-4 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/register" className={navLinkClass}>
            Register
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </main>
  );
}
