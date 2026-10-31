"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, serviceEntries, costEntries, type Part } from "@/db";
import { requireAuth } from "@/lib/auth";
import { logActivity, splitTarget } from "@/lib/data";
import { num, str } from "@/lib/format";
import { addServiceEntry } from "@/lib/writes";

function parseParts(form: FormData): Part[] {
  const names = form.getAll("partName").map(String);
  const nos = form.getAll("partNo").map(String);
  const qtys = form.getAll("partQty").map(String);
  const costs = form.getAll("partCost").map(String);
  const out: Part[] = [];
  names.forEach((n, i) => {
    if (!n.trim()) return;
    out.push({ name: n.trim(), partNo: nos[i]?.trim() || undefined, qty: Number(qtys[i]) || 1, cost: Number(String(costs[i]).replace(/[$,]/g, "")) || undefined });
  });
  return out;
}

export async function createService(form: FormData) {
  await requireAuth();
  const { targetType, targetId } = splitTarget(str(form.get("target")));
  const row = await addServiceEntry(
    {
      date: str(form.get("date")) ?? undefined,
      kind: str(form.get("kind")) ?? "maintenance",
      targetType,
      targetId,
      title: str(form.get("title")) ?? "Service",
      description: str(form.get("description")),
      performedBy: str(form.get("performedBy")),
      engineHoursAt: num(form.get("engineHoursAt")),
      parts: parseParts(form),
      laborCost: num(form.get("laborCost")),
      totalCost: num(form.get("totalCost")),
      resolvesIssueId: str(form.get("resolvesIssueId")),
    },
    "user",
  );
  redirect(`/service/${row.id}`);
}

export async function updateService(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  const { targetType, targetId } = splitTarget(str(form.get("target")));
  const parts = parseParts(form);
  const partsTotal = parts.reduce((s, p) => s + (p.cost ?? 0) * (p.qty ?? 1), 0);
  const labor = num(form.get("laborCost"));
  const total = num(form.get("totalCost")) ?? (partsTotal || labor ? partsTotal + (labor ?? 0) : null);
  const [row] = await db
    .update(serviceEntries)
    .set({
      date: str(form.get("date")) ?? undefined,
      kind: str(form.get("kind")) ?? "maintenance",
      targetType,
      targetId,
      title: str(form.get("title")) ?? "Service",
      description: str(form.get("description")),
      performedBy: str(form.get("performedBy")),
      engineHoursAt: num(form.get("engineHoursAt")),
      parts,
      laborCost: labor,
      totalCost: total,
      resolvesIssueId: str(form.get("resolvesIssueId")),
    })
    .where(eq(serviceEntries.id, id))
    .returning();
  // keep the linked cost entry in sync
  await db.delete(costEntries).where(eq(costEntries.linkedId, id));
  if (total != null && total > 0) {
    await db.insert(costEntries).values({
      boatId: row.boatId, date: row.date,
      category: row.kind === "upgrade" ? "upgrade" : row.performedBy && row.performedBy.toLowerCase() !== "diy" ? "service" : "parts",
      amount: total, vendor: row.performedBy, note: row.title, linkedType: "service_entry", linkedId: id,
    });
  }
  await logActivity({ actor: "user", action: "write", entityType: "service_entry", entityId: id, summary: `Service edited: ${row.title}` });
  redirect(`/service/${id}`);
}

export async function deleteService(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.delete(costEntries).where(eq(costEntries.linkedId, id));
  await db.delete(serviceEntries).where(eq(serviceEntries.id, id));
  redirect("/service");
}
