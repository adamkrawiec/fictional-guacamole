import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Reads apps/web/.env, .env.local, .env.[mode]. Only VITE_* variables reach the browser bundle,
  // so API_PROXY_TARGET stays a dev-server setting.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      // Dev only: forward API calls to the Express server so the browser sees a single origin.
      // In production the frontend calls the relative path /api on its own host.
      proxy: {
        "/api": env.API_PROXY_TARGET || "http://localhost:8000",
      },
    },
  };
});
