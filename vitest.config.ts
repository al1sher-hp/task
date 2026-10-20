import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // Every test run uses a fresh, isolated in-memory SQLite database.
      DB_PATH: ":memory:",
    },
    environment: "node",
  },
});
