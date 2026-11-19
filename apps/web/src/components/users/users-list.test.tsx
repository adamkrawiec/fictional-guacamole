import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UsersList } from "./users-list";

function mockFetch(result: Response | Error) {
  const fetchMock = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UsersList", () => {
  it("shows a loading state, then a row per user with name and email", async () => {
    const fetchMock = mockFetch(
      Response.json({
        users: [
          { id: "1", name: "Ada Lovelace", email: "ada@example.com" },
          { id: "2", name: "Alan Turing", email: "alan@example.com" },
        ],
      }),
    );

    render(<UsersList />);

    expect(screen.getByText("Loading users…")).toBeInTheDocument();
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");

    expect(rows).toHaveLength(3); // header + 2 users
    expect(
      within(rows[0])
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["Name", "Email"]);
    expect(
      within(rows[1])
        .getAllByRole("cell")
        .map((td) => td.textContent),
    ).toEqual(["Ada Lovelace", "ada@example.com"]);
    expect(
      within(rows[2])
        .getAllByRole("cell")
        .map((td) => td.textContent),
    ).toEqual(["Alan Turing", "alan@example.com"]);
    expect(fetchMock).toHaveBeenCalledWith("/api/users", expect.anything());
  });

  it("shows a message when there are no users", async () => {
    mockFetch(Response.json({ users: [] }));

    render(<UsersList />);

    expect(await screen.findByText("No users yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("asks the user to sign in when the API responds with 401", async () => {
    mockFetch(Response.json({ error: "Unauthorized" }, { status: 401 }));

    render(<UsersList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load users: Sign in to see the list of users",
    );
  });

  it("shows an error when the request fails", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    render(<UsersList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load users: Failed to fetch",
    );
  });
});
