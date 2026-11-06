// Must stay the first import so env vars are set before any other module reads them
import "./env";
import app from "./app";

const PORT = Number(process.env.PORT) || 8000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
