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
    return <p>Loading…</p>;
  }

  if (state.status === "error") {
    return <p role="alert">Could not reach the API: {state.error}</p>;
  }

  return <p>API says: {state.message}</p>;
}
