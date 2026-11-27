import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "./responses";

// Just enough of Express's Response to see what was sent
function fakeResponse() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as typeof res & Response;
}

describe("responses", () => {
  it.each([
    ["badRequest", (res: Response) => badRequest(res, "Bad"), 400, { error: "Bad" }],
    ["unauthorized", (res: Response) => unauthorized(res), 401, { error: "Unauthorized" }],
    ["forbidden", (res: Response) => forbidden(res), 403, { error: "Forbidden" }],
    ["notFound", (res: Response) => notFound(res), 404, { error: "Not found" }],
    [
      "notFound with a message",
      (res: Response) => notFound(res, "User not found"),
      404,
      {
        error: "User not found",
      },
    ],
    ["conflict", (res: Response) => conflict(res, "Taken"), 409, { error: "Taken" }],
  ])("%s", (_name, send, status, body) => {
    const res = fakeResponse();

    send(res);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith(body);
  });

  it("adds details to a bad request only when given", () => {
    const res = fakeResponse();

    badRequest(res, "Invalid", [{ path: "email", message: "bad" }]);

    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid",
      details: [{ path: "email", message: "bad" }],
    });
  });
});
