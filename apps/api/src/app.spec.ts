import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app";

describe("app", () => {
  describe("GET /api", () => {
    it("returns a hello world message", async () => {
      const res = await request(app).get("/api");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body).toEqual({ message: "hello world" });
    });
  });

  describe("GET /api/test", () => {
    it("returns the docker build test message", async () => {
      const res = await request(app).get("/api/test");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body).toEqual({ message: "this is to test if docker builds work" });
    });
  });

  describe("GET /health", () => {
    it("reports the app as healthy", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body).toEqual({ status: "ok" });
    });
  });
});
