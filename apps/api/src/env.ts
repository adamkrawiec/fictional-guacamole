import dotenv from "dotenv";

// Loads apps/api/.env into process.env for local development. In production (Docker) there is no
// .env file, since .dockerignore excludes it, and variables come from the container environment.
dotenv.config({ quiet: true });
