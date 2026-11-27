import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routes } from "../routes";

// A small fake API: the signed-in user, the users list, and POST /api/users
function mockApi({ signedIn = true } = {}) {
  const users = [
    { id: "u1", name: "Ada", email: "ada@example.com" },
    { id: "u2", name: "Alan", email: "alan@example.com" },
  ];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/get-session") {
      return Response.json(signedIn ? { session: {}, user: users[0] } : null);
    }
    if (url === "/api/users" && init?.method === "POST") {
      const created = { id: `u${users.length + 1}`, ...JSON.parse(String(init.body)) };
      users.push(created);
      return Response.json({ user: created }, { status: 201 });
    }
    if (url === "/api/users") {
      return Response.json({ users });
    }
    return Response.json({ message: "hello world" });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderUsersPage() {
  const router = createMemoryRouter(routes, { initialEntries: ["/users"] });
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UsersPage", () => {
  it("shows a blank form under the list", async () => {
    mockApi();
    renderUsersPage();

    const table = await screen.findByRole("table");
    const form = screen.getByRole("heading", { name: "Add a user" }).closest("section");
    if (!form) throw new Error("expected the form section");

    expect(within(table).getByRole("cell", { name: "Alan" })).toBeInTheDocument();
    expect(table.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(form).getByLabelText("Name")).toHaveValue("");
    expect(within(form).getByLabelText("Email")).toHaveValue("");
  });

  it("POSTs to /api/users and reloads the list after saving", async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    renderUsersPage();

    await user.type(await screen.findByLabelText("Name"), "Grace");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
    expect(await screen.findByRole("cell", { name: "Grace" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("doesn't show the form when signed out", async () => {
    mockApi({ signedIn: false });
    renderUsersPage();

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add a user" })).not.toBeInTheDocument();
  });
});
