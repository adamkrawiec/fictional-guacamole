import express from "express";
import * as controller from "./app.controller";

const app = express();

app.use(express.json());

app.get("/", controller.hello);

app.get("/test", controller.test);

app.get("/health", controller.health);

export default app;
