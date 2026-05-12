import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: { baseURL: "http://localhost:3001" },
  testDir: "tests/e2e",
  timeout: 60000,
});
