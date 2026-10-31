"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, apiKeys, pendingWrites } from "@/db";
import { createApiKey } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";
import { logActivity, setSetting } from "@/lib/data";
import { str } from "@/lib/format";
import { runWriteTool } from "@/lib/writes";

export async function generateKey(_prev: { raw?: string; error?: string } | undefined, form: FormData) {
  await requireAuth();
  const label = str(form.get("label")) ?? "claude";
  const scope = form.get("scope") === "read_write" ? "read_write" : "read";
  const { raw } = await createApiKey(label, scope);
  await logActivity({ actor: "user", action: "write", entityType: "api_key", summary: `API key created: ${label} (${scope})` });
  return { raw };
}

export async function revokeKey(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.update(apiKeys).set({ revokedAt: new Date().toISOString() }).where(eq(apiKeys.id, id));
  redirect("/settings");
}

export async function approveWrite(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  const [pw] = await db.select().from(pendingWrites).where(eq(pendingWrites.id, id));
  if (!pw || pw.status !== "pending") redirect("/settings");
  try {
    const result = await runWriteTool(pw.tool, pw.args);
    await db.update(pendingWrites).set({ status: "approved", resolvedAt: new Date().toISOString(), result: JSON.stringify(result).slice(0, 4000) }).where(eq(pendingWrites.id, id));
  } catch (e) {
    await db.update(pendingWrites).set({ status: "rejected", resolvedAt: new Date().toISOString(), result: `error: ${(e as Error).message}` }).where(eq(pendingWrites.id, id));
  }
  redirect("/settings");
}

export async function rejectWrite(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.update(pendingWrites).set({ status: "rejected", resolvedAt: new Date().toISOString() }).where(eq(pendingWrites.id, id));
  await logActivity({ actor: "user", action: "write", summary: "Rejected a pending write from Claude" });
  redirect("/settings");
}

export async function setApproval(form: FormData) {
  await requireAuth();
  await setSetting("mcp_require_approval", form.get("require") === "on" ? "true" : "false");
  redirect("/settings");
}
