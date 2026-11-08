import { Hello } from "./Hello";

export function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h1 className="text-3xl font-bold tracking-tight">Hello world</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Fictional Guacamole frontend</p>
        <div className="mt-6">
          <Hello />
        </div>
      </div>
    </main>
  );
}
