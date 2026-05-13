import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: { baseURL: "http://localhost:3001" },
  timeout: 60000,
  snapshotDir: "tests/visual/screenshots",
});
