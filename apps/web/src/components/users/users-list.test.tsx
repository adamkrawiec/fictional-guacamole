import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UsersList } from "./users-list";

function mockFetch(result: Response | Error) {
  const fetchMock = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// The names are router links, so the list needs a router around it
function renderList() {
  render(
    <MemoryRouter>
      <UsersList />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks(); // window.confirm
  vi.unstubAllGlobals();
});

describe("UsersList", () => {
  it("links a name to the showPath the API sends", async () => {
    mockFetch(
      Response.json({
        users: [
          { id: "1", name: "Ada Lovelace", email: "ada@example.com", showPath: "/users/1" },
          { id: "2", name: "", email: "noname@example.com", showPath: "/somewhere/else" },
        ],
      }),
    );

    renderList();

    expect(await screen.findByRole("link", { name: "Ada Lovelace" })).toHaveAttribute(
      "href",
      "/users/1",
    );
    expect(screen.getByRole("link", { name: "(no name)" })).toHaveAttribute(
      "href",
      "/somewhere/else",
    );
    expect(screen.queryByRole("link", { name: "ada@example.com" })).not.toBeInTheDocument();
  });

  it("deletes a user with the trash button and removes their row", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      return Response.json({
        users: [
          { id: "1", name: "Ada", email: "ada@example.com" },
          { id: "2", name: "Alan", email: "alan@example.com", deletePath: "/api/users/2" },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderList();

    // Only users the API sends a deletePath for get a trash button
    expect(await screen.findByRole("button", { name: "Delete Alan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Ada" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Alan" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/users/2", { method: "DELETE" });
    expect(screen.queryByRole("cell", { name: "Alan" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
  });

  it("keeps the row and shows the error when deleting fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) =>
        init?.method === "DELETE"
          ? Response.json({ error: "Forbidden" }, { status: 403 })
          : Response.json({
              users: [
                { id: "2", name: "Alan", email: "a@example.com", deletePath: "/api/users/2" },
              ],
            }),
      ),
    );
    const user = userEvent.setup();
    renderList();

    await user.click(await screen.findByRole("button", { name: "Delete Alan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Forbidden");
    expect(screen.getByRole("cell", { name: "Alan" })).toBeInTheDocument();
  });

  it("shows the avatar placeholder in the first column of every row", async () => {
    mockFetch(
      Response.json({
        users: [
          { id: "1", name: "Ada", email: "ada@example.com" },
          { id: "2", name: "Alan", email: "alan@example.com" },
        ],
      }),
    );

    renderList();

    const table = await screen.findByRole("table");
    const [, ...userRows] = within(table).getAllByRole("row");
    for (const row of userRows) {
      const firstCell = within(row).getAllByRole("cell")[0];
      const img = firstCell.querySelector("img");
      expect(img).toHaveAttribute("src", expect.stringContaining("avatar-placeholder"));
      expect(img).toHaveAttribute("alt", "");
    }
    expect(userRows).toHaveLength(2);
  });

  it("shows a pencil link to editPath, only for users the API sends one for", async () => {
    mockFetch(
      Response.json({
        users: [
          { id: "1", name: "Ada", email: "ada@example.com", editPath: "/users/1/edit" },
          { id: "2", name: "", email: "noname@example.com", editPath: "/users/2/edit" },
          { id: "3", name: "Alan", email: "alan@example.com" },
        ],
      }),
    );

    renderList();

    expect(await screen.findByRole("link", { name: "Edit Ada" })).toHaveAttribute(
      "href",
      "/users/1/edit",
    );
    // No name: labelled with the email instead
    expect(screen.getByRole("link", { name: "Edit noname@example.com" })).toHaveAttribute(
      "href",
      "/users/2/edit",
    );
    expect(screen.queryByRole("link", { name: "Edit Alan" })).not.toBeInTheDocument();
  });

  it("shows the name as plain text when there's no showPath", async () => {
    mockFetch(
      Response.json({
        users: [
          { id: "1", name: "Ada Lovelace", email: "ada@example.com", showPath: "/users/1" },
          { id: "2", name: "Alan Turing", email: "alan@example.com" },
          { id: "3", name: "", email: "noname@example.com" },
        ],
      }),
    );

    renderList();

    expect(await screen.findByRole("cell", { name: "Alan Turing" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alan Turing" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "(no name)" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows a loading state, then a row per user with name and email", async () => {
    const fetchMock = mockFetch(
      Response.json({
        users: [
          { id: "1", name: "Ada Lovelace", email: "ada@example.com" },
          { id: "2", name: "Alan Turing", email: "alan@example.com" },
        ],
      }),
    );

    renderList();

    expect(screen.getByText("Loading users…")).toBeInTheDocument();
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");

    expect(rows).toHaveLength(3); // header + 2 users
    expect(
      within(rows[0])
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["Avatar", "Name", "Email", "Actions"]); // "Avatar", "Actions": screen-reader-only
    expect(
      within(rows[1])
        .getAllByRole("cell")
        .map((td) => td.textContent),
    ).toEqual(["", "Ada Lovelace", "ada@example.com", ""]);
    expect(
      within(rows[2])
        .getAllByRole("cell")
        .map((td) => td.textContent),
    ).toEqual(["", "Alan Turing", "alan@example.com", ""]);
    expect(fetchMock).toHaveBeenCalledWith("/api/users", expect.anything());
  });

  it("shows a message when there are no users", async () => {
    mockFetch(Response.json({ users: [] }));

    renderList();

    expect(await screen.findByText("No users yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("asks the user to sign in when the API responds with 401", async () => {
    mockFetch(Response.json({ error: "Unauthorized" }, { status: 401 }));

    renderList();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load users: Sign in to see the list of users",
    );
  });

  it("shows an error when the request fails", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    renderList();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load users: Failed to fetch",
    );
  });
});
