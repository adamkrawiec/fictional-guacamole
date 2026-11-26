import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { EditUserLink } from "./edit-user-link";

const renderLink = (props: Parameters<typeof EditUserLink>[0]) =>
  render(
    <MemoryRouter>
      <EditUserLink {...props} />
    </MemoryRouter>,
  );

describe("EditUserLink", () => {
  it("is an icon-only link with an accessible label and tooltip by default", () => {
    renderLink({ to: "/users/u1/edit", userLabel: "Ada" });

    const link = screen.getByRole("link", { name: "Edit Ada" });
    expect(link).toHaveAttribute("href", "/users/u1/edit");
    expect(link).toHaveAttribute("title", "Edit Ada");
    expect(link).toHaveTextContent(/^$/);
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("can show the word Edit next to the pencil", () => {
    renderLink({ to: "/users/u1/edit", userLabel: "Ada", withText: true });

    expect(screen.getByRole("link", { name: "Edit" })).toHaveTextContent("Edit");
  });
});
