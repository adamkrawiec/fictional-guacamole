import type { Request, Response } from "express";
import { prisma } from "../db/prisma";

export const todosIndex = async(req: Request, res: Response) => {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } })
  res.json({ todos });
}

export const todoShow = async(
  req: Request<{ id: string }>,
  res: Response
) => {
  const id = parseInt(req.params.id)
  const todo = await prisma.todo.findFirstOrThrow({ where: { id }})
  res.json({ todo })
}