import express, { Request, Response } from "express";

const app = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "hello world" });
});

app.get("/test", (_req: Request, res: Response) => {
  res.json({ message: "this is to test if docker builds work" })
})

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
