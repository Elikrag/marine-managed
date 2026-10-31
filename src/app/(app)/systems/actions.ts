"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, systems } from "@/db";
import { requireAuth } from "@/lib/auth";
import { logActivity, requireBoat } from "@/lib/data";
import { str } from "@/lib/format";

export async function saveSystem(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  const id = str(form.get("id"));
  const values = {
    boatId: boat.id,
    category: str(form.get("category")) ?? "other",
    name: str(form.get("name")) ?? "Unnamed",
    make: str(form.get("make")),
    model: str(form.get("model")),
    serial: str(form.get("serial")),
    installedOn: str(form.get("installedOn")),
    notes: str(form.get("notes")),
  };
  if (id) await db.update(systems).set(values).where(eq(systems.id, id));
  else await db.insert(systems).values(values);
  await logActivity({ actor: "user", action: "write", entityType: "system", entityId: id ?? undefined, summary: `System ${id ? "updated" : "added"}: ${values.name}` });
  redirect("/systems");
}

export async function deleteSystem(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"));
  if (id) await db.delete(systems).where(eq(systems.id, id));
  redirect("/systems");
}
