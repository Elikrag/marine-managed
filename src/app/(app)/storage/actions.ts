"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, storage, costEntries } from "@/db";
import { requireAuth } from "@/lib/auth";
import { logActivity, requireBoat } from "@/lib/data";
import { num, str } from "@/lib/format";

export async function saveStorage(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  const id = str(form.get("id"));
  const values = {
    boatId: boat.id,
    target: str(form.get("target")) ?? "boat",
    kind: str(form.get("kind")) ?? "other",
    locationName: str(form.get("locationName")) ?? "Storage",
    address: str(form.get("address")),
    contact: str(form.get("contact")),
    cost: num(form.get("cost")),
    billingPeriod: str(form.get("billingPeriod")) ?? "season",
    seasonStart: str(form.get("seasonStart")),
    seasonEnd: str(form.get("seasonEnd")),
    notes: str(form.get("notes")),
  };
  let sid = id;
  if (id) await db.update(storage).set(values).where(eq(storage.id, id));
  else {
    const [r] = await db.insert(storage).values(values).returning();
    sid = r.id;
  }
  await db.delete(costEntries).where(eq(costEntries.linkedId, sid!));
  if (values.cost && values.seasonStart) {
    await db.insert(costEntries).values({ boatId: boat.id, date: values.seasonStart, category: "storage", amount: values.cost, vendor: values.locationName, note: `${values.kind} · ${values.target}`, linkedType: "storage", linkedId: sid! });
  }
  await logActivity({ actor: "user", action: "write", entityType: "storage", entityId: sid!, summary: `Storage ${id ? "updated" : "added"}: ${values.locationName}` });
  redirect("/storage");
}

export async function deleteStorage(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.delete(costEntries).where(eq(costEntries.linkedId, id));
  await db.delete(storage).where(eq(storage.id, id));
  redirect("/storage");
}
