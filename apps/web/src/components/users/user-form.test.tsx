import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserForm } from "./user-form";

const ada = { id: "u1", name: "Ada", email: "ada@example.com" };

function mockFetch(result: Response | Error | Promise<Response>) {
  const fetchMock = vi.fn(() => (result instanceof Error ? Promise.reject(result) : result));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillIn(name: string, email: string) {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText("Name"));
  if (name) await user.type(screen.getByLabelText("Name"), name);
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), email);
  return user;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UserForm", () => {
  describe("blank (adding)", () => {
    it("starts empty", () => {
      render(<UserForm endpoint="/api/users" />);

      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByLabelText("Email")).toHaveValue("");
    });

    it("POSTs to the endpoint, reports success and empties the form again", async () => {
      const fetchMock = mockFetch(Promise.resolve(Response.json({ user: ada }, { status: 201 })));
      const onSaved = vi.fn();
      render(<UserForm endpoint="/api/users" onSaved={onSaved} />);

      const user = await fillIn("Ada", "ada@example.com");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Saved. We sent a verification link to ada@example.com.",
      );
      expect(fetchMock).toHaveBeenCalledWith("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ada", email: "ada@example.com" }),
      });
      expect(onSaved).toHaveBeenCalledWith(ada);
      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByLabelText("Email")).toHaveValue("");
    });
  });

  describe("prefilled (editing)", () => {
    const edit = (props: { onSaved?: () => void } = {}) =>
      render(
        <UserForm
          endpoint="/api/users/u1"
          method="PATCH"
          initialValues={{ name: ada.name, email: ada.email }}
          {...props}
        />,
      );

    it("starts with the given values", () => {
      edit();

      expect(screen.getByLabelText("Name")).toHaveValue("Ada");
      expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    });

    it("sends the changes with the given method and keeps them in the form", async () => {
      const saved = { ...ada, name: "Ada Lovelace" };
      const fetchMock = mockFetch(Promise.resolve(Response.json({ user: saved })));
      edit();

      const user = await fillIn("Ada Lovelace", "ada@example.com");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByRole("status")).toHaveTextContent(/^Saved\.$/);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/users/u1",
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
    });

    it("mentions the verification link when the email changed", async () => {
      mockFetch(Promise.resolve(Response.json({ user: { ...ada, email: "new@example.com" } })));
      edit();

      const user = await fillIn("Ada", "new@example.com");
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByRole("status")).toHaveTextContent(
        "We sent a verification link to new@example.com",
      );
    });
  });

  it("disables the button while saving", async () => {
    let respond: (res: Response) => void = () => {};
    mockFetch(
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
    );
    render(<UserForm endpoint="/api/users" />);

    const user = await fillIn("", "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    respond(Response.json({ user: ada }));
    expect(await screen.findByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("shows the API's error message and keeps what was typed", async () => {
    mockFetch(
      Promise.resolve(
        Response.json({ error: "A user with this email already exists" }, { status: 409 }),
      ),
    );
    const onSaved = vi.fn();
    render(<UserForm endpoint="/api/users" onSaved={onSaved} />);

    const user = await fillIn("Ada", "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A user with this email already exists",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("shows an error when the server can't be reached", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    render(<UserForm endpoint="/api/users" />);

    const user = await fillIn("", "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
  });
});
