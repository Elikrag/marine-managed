import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./data/marine.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  ...(authToken
    ? { dialect: "turso", dbCredentials: { url, authToken } }
    : { dialect: "sqlite", dbCredentials: { url } }),
});
