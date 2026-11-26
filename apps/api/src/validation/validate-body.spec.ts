import express from "express";
import Joi from "joi";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { validateBody } from "./validate-body";

// A throwaway app with one validated route, echoing what the handler receives
const app = express()
  .use(express.json())
  .post(
    "/things",
    validateBody(Joi.object({ title: Joi.string().trim().required(), count: Joi.number() })),
    (req, res) => {
      res.json({ received: req.body });
    },
  );

describe("validateBody", () => {
  it("passes Joi's converted value to the handler", async () => {
    const res = await request(app).post("/things").send({ title: "  hello ", count: "3" });

    expect(res.status).toBe(200);
    expect(res.body.received).toEqual({ title: "hello", count: 3 });
  });

  it("answers 400 with every problem, before the handler runs", async () => {
    const res = await request(app).post("/things").send({ count: "lots", extra: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: '"title" is required',
      details: [
        { path: "title", message: '"title" is required' },
        { path: "count", message: '"count" must be a number' },
        { path: "extra", message: '"extra" is not allowed' },
      ],
    });
  });

  it("treats a missing body as empty", async () => {
    const res = await request(app).post("/things");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('"title" is required');
  });
});
