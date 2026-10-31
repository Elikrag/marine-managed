"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, costEntries } from "@/db";
import { requireAuth } from "@/lib/auth";
import { num, str } from "@/lib/format";
import { addCostEntry } from "@/lib/writes";

export async function createCost(form: FormData) {
  await requireAuth();
  await addCostEntry({ date: str(form.get("date")) ?? undefined, category: str(form.get("category")) ?? "other", amount: num(form.get("amount")) ?? 0, vendor: str(form.get("vendor")), note: str(form.get("note")) }, "user");
  redirect("/costs");
}

export async function deleteCost(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.delete(costEntries).where(eq(costEntries.id, id));
  redirect("/costs");
}
