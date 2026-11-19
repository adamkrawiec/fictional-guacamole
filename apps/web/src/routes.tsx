import type { RouteObject } from "react-router";
import { App } from "./App";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage, registerAction } from "./pages/RegisterPage";
import { UsersPage } from "./pages/UsersPage";

// All app routes in one place. main.tsx wraps them in a browser router; tests use a memory router.
// Add a page: create it in src/pages/ and add a child here, e.g. { path: "login", element: <LoginPage /> }.
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "register", element: <RegisterPage />, action: registerAction },
      { path: "users", element: <UsersPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
