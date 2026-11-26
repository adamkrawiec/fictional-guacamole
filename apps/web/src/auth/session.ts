import { redirect, useRouteLoaderData } from "react-router";

// The signed-in user, as Better Auth's GET /api/auth/get-session returns it (null when signed out)
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type SessionData = { user: SessionUser } | null;

// Root route loader: runs on page load and again after every form action (register, logout),
// so the nav always reflects the current session.
export async function sessionLoader(): Promise<SessionData> {
  try {
    const res = await fetch("/api/auth/get-session");
    if (!res.ok) {
      return null;
    }
    const data: { user?: SessionUser } | null = await res.json();
    return data?.user ? { user: data.user } : null;
  } catch {
    // API unreachable: treat as signed out rather than breaking the whole app
    return null;
  }
}

// The current session from any page (null when signed out). Same data as the navbar's.
export function useSession(): SessionData {
  return (useRouteLoaderData("root") as SessionData | undefined) ?? null;
}

// POST /logout (from the nav's form): ends the session, which clears the cookie, then goes home
export async function logoutAction() {
  await fetch("/api/auth/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => {
    // Nothing useful to show; the reloaded session below tells the truth either way
  });
  return redirect("/");
}
