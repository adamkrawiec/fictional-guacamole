import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routes } from "../routes";

const ada = { id: "1", name: "Ada Lovelace", email: "ada@example.com" };

// A tiny fake API: get-session answers with the user until sign-out is called
function mockApi() {
  let signedIn = true;
  const fetchMock = vi.fn((url: string) => {
    if (url === "/api/auth/get-session") {
      return Promise.resolve(Response.json(signedIn ? { session: {}, user: ada } : null));
    }
    if (url === "/api/users") {
      return Promise.resolve(Response.json({ users: [ada] }));
    }
    if (url === "/api/auth/sign-out") {
      signedIn = false;
      return Promise.resolve(Response.json({ success: true }));
    }
    return Promise.resolve(Response.json({ message: "hello world" }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session in the nav", () => {
  it("shows Log in and Register, and hides Users and Log out, when signed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json(null))),
    );

    renderAt("/");

    expect(await screen.findByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("shows the user's email and logs them out", async () => {
    const fetchMock = mockApi();
    const router = renderAt("/users");

    expect(await screen.findByText("ada@example.com", { selector: "nav *" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/sign-out",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
