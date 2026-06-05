import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: "http://localhost:3001",
    // Platform-independent snapshot paths so CI (Linux) matches dev (macOS)
    snapshotPathTemplate: "{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
  },
  timeout: 60000,
  snapshotDir: "tests/visual/screenshots",
});
