import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routes } from "../routes";

const ada = { id: "1", name: "Ada Lovelace", email: "ada@example.com" };

// Fake API: sign-in succeeds only with the right password, and get-session reflects it
function mockApi() {
  let signedIn = false;
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/auth/sign-in/email") {
      const { password } = JSON.parse(String(init?.body));
      if (password !== "correct-horse-battery") {
        return Promise.resolve(
          Response.json(
            { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" },
            { status: 401 },
          ),
        );
      }
      signedIn = true;
      return Promise.resolve(Response.json({ token: "t", user: ada }));
    }
    if (url === "/api/auth/get-session") {
      return Promise.resolve(Response.json(signedIn ? { session: {}, user: ada } : null));
    }
    return Promise.resolve(Response.json({ message: "hello world" }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function logIn(password: string) {
  const router = createMemoryRouter(routes, { initialEntries: ["/login"] });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Log in" }));
  return router;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LoginPage", () => {
  it("logs the user in, goes home and shows them in the navbar", async () => {
    const fetchMock = mockApi();
    const router = await logIn("correct-horse-battery");

    expect(await screen.findByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/sign-in/email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com", password: "correct-horse-battery" }),
      }),
    );
  });

  it("shows the API's error for a wrong password and stays on the form", async () => {
    mockApi();
    const router = await logIn("wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(router.state.location.pathname).toBe("/login");
  });
});
