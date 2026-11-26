import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteUserButton } from "./delete-user-button";

function setup({ confirm = true, response }: { confirm?: boolean; response?: Response | Error }) {
  vi.spyOn(window, "confirm").mockReturnValue(confirm);
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response ?? new Response(null, { status: 204 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const onDeleted = vi.fn();
  const onError = vi.fn();
  render(
    <DeleteUserButton
      endpoint="/api/users/u1"
      userLabel="Ada"
      onDeleted={onDeleted}
      onError={onError}
    />,
  );
  return { fetchMock, onDeleted, onError, user: userEvent.setup() };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DeleteUserButton", () => {
  it("is an icon button labelled for screen readers", () => {
    setup({});

    const button = screen.getByRole("button", { name: "Delete Ada" });

    expect(button).toHaveAttribute("title", "Delete Ada");
  });

  it("asks first, then sends DELETE to the endpoint", async () => {
    const { fetchMock, onDeleted, user } = setup({});

    await user.click(screen.getByRole("button", { name: "Delete Ada" }));

    expect(window.confirm).toHaveBeenCalledWith("Delete Ada? This can't be undone.");
    expect(fetchMock).toHaveBeenCalledWith("/api/users/u1", { method: "DELETE" });
    expect(onDeleted).toHaveBeenCalled();
  });

  it("does nothing when the confirmation is cancelled", async () => {
    const { fetchMock, onDeleted, user } = setup({ confirm: false });

    await user.click(screen.getByRole("button", { name: "Delete Ada" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("reports the API's error message", async () => {
    const { onDeleted, onError, user } = setup({
      response: Response.json({ error: "You can't delete your own account" }, { status: 400 }),
    });

    await user.click(screen.getByRole("button", { name: "Delete Ada" }));

    expect(onError).toHaveBeenCalledWith("You can't delete your own account");
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("reports a network failure", async () => {
    const { onError, user } = setup({ response: new TypeError("Failed to fetch") });

    await user.click(screen.getByRole("button", { name: "Delete Ada" }));

    expect(onError).toHaveBeenCalledWith("Could not reach the server. Please try again.");
  });
});
