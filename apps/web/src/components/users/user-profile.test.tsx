import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserProfile } from "./user-profile";

function mockFetch(handler: (url: string) => Response | Error) {
  const fetchMock = vi.fn(async (url: string) => {
    const result = handler(url);
    if (result instanceof Error) throw result;
    return result;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// The component reads :id from the URL, so it needs a router around it
function renderAt(path: string) {
  const router = createMemoryRouter([{ path: "/users/:id", element: <UserProfile /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UserProfile", () => {
  it("fetches the user from the id in the URL and shows only name and email", async () => {
    const fetchMock = mockFetch(() =>
      Response.json({
        user: { id: "u1", name: "Ada Lovelace", email: "ada@example.com", role: "admin" },
      }),
    );

    renderAt("/users/u1");

    expect(screen.getByText("Loading user…")).toBeInTheDocument();
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/u1", expect.anything());
  });

  it("loads the new user when the id in the URL changes", async () => {
    const fetchMock = mockFetch((url) =>
      Response.json({
        user: url.endsWith("/u2")
          ? { name: "Alan", email: "alan@example.com" }
          : { name: "Ada", email: "ada@example.com" },
      }),
    );
    const router = renderAt("/users/u1");
    expect(await screen.findByText("Ada")).toBeInTheDocument();

    await router.navigate("/users/u2");

    expect(await screen.findByText("Alan")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/u2", expect.anything());
  });

  it.each([
    [404, "User not found"],
    [401, "Sign in to see this user"],
    [500, "API responded with 500"],
  ])("shows a message when the API answers %i", async (status, message) => {
    mockFetch(() => Response.json({ error: "x" }, { status }));

    renderAt("/users/u1");

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("shows an error when the request fails", async () => {
    mockFetch(() => new TypeError("Failed to fetch"));

    renderAt("/users/u1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch");
  });

  it("shows an edit link when the API sends editPath, and none otherwise", async () => {
    mockFetch((url) =>
      Response.json({
        user: url.endsWith("/u1")
          ? { name: "Ada", email: "ada@example.com", editPath: "/users/u1/edit" }
          : { name: "Alan", email: "alan@example.com" },
      }),
    );
    const router = renderAt("/users/u1");

    expect(await screen.findByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/users/u1/edit",
    );

    await router.navigate("/users/u2");

    expect(await screen.findByText("Alan")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("shows a dash for an empty name", async () => {
    mockFetch(() => Response.json({ user: { name: "", email: "ada@example.com" } }));

    renderAt("/users/u1");

    expect(await screen.findByText("—")).toBeInTheDocument();
  });
});
