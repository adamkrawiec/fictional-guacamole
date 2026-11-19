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

    expect(screen.getByRole("heading", { name: "Hello world" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByText("API says: hello world")).toBeInTheDocument();
  });

  it("renders the not-found page for unknown paths", () => {
    renderAt("/does-not-exist");

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
