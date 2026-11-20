import { Hello } from "../Hello";

export function HomePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Hello world</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Fictional Guacamole frontend</p>
      <div className="mt-6">
        <Hello />
      </div>
    </>
  );
}
