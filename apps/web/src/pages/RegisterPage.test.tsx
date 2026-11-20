import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routes } from "../routes";

function mockFetch(handler: (url: string) => Response | Error) {
  const fetchMock = vi.fn((url: string) => {
    const result = handler(url);
    return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderRegister() {
  const router = createMemoryRouter(routes, { initialEntries: ["/register"] });
  render(<RouterProvider router={router} />);
  return router;
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText(/Password/), "correct-horse-battery");
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RegisterPage", () => {
  it("signs the user up and goes to the home page", async () => {
    const fetchMock = mockFetch((url) =>
      url === "/api/auth/sign-up/email"
        ? Response.json({ token: "t", user: { email: "ada@example.com" } })
        : Response.json({ message: "hello world" }),
    );
    const router = renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole("heading", { name: "Hello world" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/sign-up/email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Ada Lovelace",
          email: "ada@example.com",
          password: "correct-horse-battery",
        }),
      }),
    );
  });

  it("shows the API's error message and stays on the form", async () => {
    mockFetch(() =>
      Response.json(
        { code: "USER_ALREADY_EXISTS", message: "User already exists" },
        { status: 422 },
      ),
    );
    const router = renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("User already exists");
    expect(router.state.location.pathname).toBe("/register");
  });

  it("shows an error when the server can't be reached", async () => {
    mockFetch(() => new TypeError("Failed to fetch"));
    renderRegister();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
  });
});
