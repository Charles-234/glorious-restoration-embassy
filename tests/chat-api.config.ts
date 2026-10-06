import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "chat-api.spec.ts",
  fullyParallel: false,
  reporter: "list",
});
