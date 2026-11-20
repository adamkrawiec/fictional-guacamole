import type { RouteObject } from "react-router";
import { App } from "./App";
import { logoutAction, sessionLoader } from "./auth/session";
import { HomePage } from "./pages/HomePage";
import { LoginPage, loginAction } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage, registerAction } from "./pages/RegisterPage";
import { UsersPage } from "./pages/UsersPage";

// All app routes in one place. main.tsx wraps them in a browser router; tests use a memory router.
// Add a page: create it in src/pages/ and add a child here, e.g. { path: "login", element: <LoginPage /> }.
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    loader: sessionLoader, // the current user, for the nav
    // Shown for the moment before the first session check answers
    hydrateFallbackElement: <main className="min-h-screen bg-slate-50 dark:bg-slate-950" />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage />, action: loginAction },
      { path: "register", element: <RegisterPage />, action: registerAction },
      { path: "users", element: <UsersPage /> },
      { path: "logout", action: logoutAction },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
