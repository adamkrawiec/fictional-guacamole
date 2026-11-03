import app from "./app";

const PORT = Number(process.env.PORT) || 8000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
