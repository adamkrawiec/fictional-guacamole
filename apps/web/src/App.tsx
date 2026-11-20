import { Outlet } from "react-router";
import { Navbar } from "./Navbar";

// Root layout: a navbar pinned to the top, and every page rendered inside <Outlet /> below it
export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      {/* 3.5rem = the navbar's height (h-14), so the card stays centred in the space below it */}
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
