// Runs Drizzle migrations against DATABASE_URL. Used by the container entrypoint.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const client = createClient({ url: process.env.DATABASE_URL ?? "file:./data/marine.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
console.log("migrations applied");
