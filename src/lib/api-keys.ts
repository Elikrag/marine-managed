import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, apiKeys } from "@/db";

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(label: string, scope: "read" | "read_write") {
  const raw = "mm_" + randomBytes(24).toString("base64url");
  const [row] = await db.insert(apiKeys).values({ label, scope, keyHash: hashKey(raw), prefix: raw.slice(0, 10) }).returning();
  return { raw, row };
}

export async function verifyApiKey(raw: string | null | undefined) {
  if (!raw) return null;
  const [row] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hashKey(raw)));
  if (!row || row.revokedAt) return null;
  await db.update(apiKeys).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiKeys.id, row.id));
  return row;
}
