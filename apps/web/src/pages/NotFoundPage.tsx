import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        There is nothing at this address.{" "}
        <Link to="/" className="underline">
          Go home
        </Link>
      </p>
    </>
  );
}
