import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/marine.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof make> };

function make() {
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export const db = globalForDb.__db ?? make();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export * from "./schema";
