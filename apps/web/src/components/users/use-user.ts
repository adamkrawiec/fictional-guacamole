import { useEffect, useState } from "react";
import type { UserDto } from "./user-dto";

export type UserState =
  | { status: "loading" }
  | { status: "success"; user: UserDto }
  | { status: "error"; error: string };

// Messages for the answers the API gives on purpose. 404 also covers someone else's account
// for non-admins: the API doesn't reveal that it exists.
const errorMessages: Record<number, string> = {
  401: "Sign in to see this user",
  404: "User not found",
};

// Loads one user from GET /api/users/:id, again whenever the id changes
export function useUser(id: string): UserState {
  const [state, setState] = useState<UserState>({ status: "loading" });

  useEffect(() => {
    // Cancels the request if the id changes or the component unmounts (and on StrictMode's
    // dev double-run)
    const controller = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/users/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(errorMessages[res.status] ?? `API responded with ${res.status}`);
        }
        const data: { user: UserDto } = await res.json();
        setState({ status: "success", user: data.user });
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
  }, [id]);

  return state;
}
