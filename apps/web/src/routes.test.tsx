import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  // The home page calls the API; answer it so the test needs no server
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json({ message: "hello world" }))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("routes", () => {
  it("renders the home page at /", async () => {
    renderAt("/");

    expect(await screen.findByRole("heading", { name: "Hello world" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByText("API says: hello world")).toBeInTheDocument();
  });

  it("renders the users page at /users", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const ada = { id: "1", name: "Ada Lovelace", email: "ada@example.com" };
        const body =
          url === "/api/auth/get-session" ? { session: {}, user: ada } : { users: [ada] };
        return Promise.resolve(Response.json(body));
      }),
    );

    renderAt("/users");

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("cell", { name: "ada@example.com" })).toBeInTheDocument();
  });

  it("renders a user's profile at /users/:id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const body =
          url === "/api/users/u1"
            ? { user: { id: "u1", name: "Ada Lovelace", email: "ada@example.com" } }
            : null;
        return Promise.resolve(Response.json(body));
      }),
    );

    renderAt("/users/u1");

    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders the not-found page for unknown paths", async () => {
    renderAt("/does-not-exist");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
