import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routes } from "../routes";

const ada = { id: "u1", name: "Ada", email: "ada@example.com", showPath: "/users/u1" };

// Fake API: the session, GET /api/users/:id and PATCH /api/users/:id
function mockApi(user: typeof ada | null = ada) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/get-session") {
      return Response.json({ session: {}, user: ada });
    }
    if (url === "/api/users/u1" && init?.method === "PATCH") {
      return Response.json({ user: { ...ada, ...JSON.parse(String(init.body)) } });
    }
    if (url === "/api/users/u1" && user) {
      return Response.json({ user });
    }
    if (url.startsWith("/api/users/")) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({ message: "hello world" });
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

describe("UserEditPage", () => {
  it("fills the form with the user from the URL", async () => {
    mockApi();
    renderAt("/users/u1/edit");

    expect(await screen.findByRole("heading", { name: "Edit user" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
  });

  it("saves with PATCH /api/users/:id", async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderAt("/users/u1/edit");

    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
    expect(fetchMock).toHaveBeenCalledWith("/api/users/u1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada Lovelace", email: "ada@example.com" }),
    });
    expect(name).toHaveValue("Ada Lovelace");
  });

  it("links back to the profile through showPath", async () => {
    mockApi();
    renderAt("/users/u1/edit");

    expect(await screen.findByRole("link", { name: "Back to profile" })).toHaveAttribute(
      "href",
      "/users/u1",
    );
  });

  it("shows the API's not-found message and no form", async () => {
    mockApi(null);
    renderAt("/users/u1/edit");

    expect(await screen.findByRole("alert")).toHaveTextContent("User not found");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});
