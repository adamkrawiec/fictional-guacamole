import type { Request, Response } from "express";

export const hello = (_req: Request, res: Response) => {
  res.json({ message: "hello world" });
};

export const test = (_req: Request, res: Response) => {
  res.json({ message: "this is to test if docker builds work" });
};

export const health = (_req: Request, res: Response) => {
  res.json({ status: "ok" });
};
