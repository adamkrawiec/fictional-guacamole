import { useEffect, useState } from "react";

type HelloResponse = {
  message: string;
};

type State =
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; error: string };

export function Hello() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // Cancels the request if the component unmounts (and on React StrictMode's dev double-run)
    const controller = new AbortController();

    fetch("/api", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }
        const data: HelloResponse = await res.json();
        setState({ status: "success", message: data.message });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <p className="animate-pulse text-slate-500 dark:text-slate-400">Loading…</p>;
  }

  if (state.status === "error") {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
      >
        Could not reach the API: {state.error}
      </p>
    );
  }

  return (
    <p className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900">
      API says: {state.message}
    </p>
  );
}
