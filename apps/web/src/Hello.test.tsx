import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Hello } from "./Hello";

// Replaces the browser's fetch for one test. Hello.tsx itself stays unmocked.
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

describe("Hello", () => {
  it("shows a loading state, then the message from the API", async () => {
    const fetchMock = mockFetch(Response.json({ message: "hello world" }));

    render(<Hello />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(await screen.findByText("API says: hello world")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api", expect.anything());
  });

  it("shows an error when the API responds with an error status", async () => {
    mockFetch(new Response(null, { status: 500 }));

    render(<Hello />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the API: API responded with 500",
    );
  });

  it("shows an error when the request fails", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    render(<Hello />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the API: Failed to fetch",
    );
  });
});
