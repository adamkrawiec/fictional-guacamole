import "../env";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../app";
import { prisma } from "../db/prisma";

type Todo = Awaited<ReturnType<typeof prisma.todo.create>>;

describe("todo.router", () => {
  let todos: Todo[] = [];

  beforeAll(async () => {
    todos = await prisma.$transaction([
      prisma.todo.create({
        data: { title: "Buy groceries" },
      }),
      prisma.todo.create({
        data: { title: "Walk the dog", done: true },
      }),
    ]);
  });

  afterAll(async () => {
    const todoIds = todos.map(({ id }) => id);

    if (todoIds.length > 0) {
      await prisma.todo.deleteMany({
        where: { id: { in: todoIds } },
      });
    }
  });

  describe("GET /api/todos", () => {
    it("returns a list of todos", async () => {
      const [firstTodo, secondTodo] = todos;
      const res = await request(app).get("/api/todos");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
      expect(res.body.todos).toEqual(
        expect.arrayContaining([
          {
            ...firstTodo,
            createdAt: firstTodo.createdAt.toISOString(),
            updatedAt: firstTodo.updatedAt.toISOString(),
          },
          {
            ...secondTodo,
            createdAt: secondTodo.createdAt.toISOString(),
            updatedAt: secondTodo.updatedAt.toISOString(),
          },
        ]),
      );
    });
  });
});
