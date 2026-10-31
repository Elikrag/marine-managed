"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, engines, serviceIntervals } from "@/db";
import { requireAuth } from "@/lib/auth";
import { logActivity, requireBoat } from "@/lib/data";
import { int, num, str } from "@/lib/format";
import { updateEngineHours } from "@/lib/writes";

export async function saveEngine(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  const id = str(form.get("id"));
  const values = {
    boatId: boat.id,
    make: str(form.get("make")),
    model: str(form.get("model")),
    year: int(form.get("year")),
    serial: str(form.get("serial")),
    hp: int(form.get("hp")),
    fuelType: str(form.get("fuelType")),
    driveType: str(form.get("driveType")),
    prop: str(form.get("prop")),
    gearRatio: str(form.get("gearRatio")),
    notes: str(form.get("notes")),
  };
  if (id) await db.update(engines).set(values).where(eq(engines.id, id));
  else {
    await db.insert(engines).values({ ...values, currentHours: num(form.get("currentHours")) ?? 0, hoursUpdatedAt: new Date().toISOString().slice(0, 10) });
  }
  await logActivity({ actor: "user", action: "write", entityType: "engine", entityId: id ?? undefined, summary: `Engine ${id ? "updated" : "added"}: ${values.make ?? ""} ${values.model ?? ""}` });
  redirect("/engines");
}

export async function deleteEngine(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"));
  if (id) {
    await db.delete(serviceIntervals).where(eq(serviceIntervals.engineId, id));
    await db.delete(engines).where(eq(engines.id, id));
  }
  redirect("/engines");
}

export async function setHours(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"));
  const hours = num(form.get("hours"));
  if (id && hours != null) await updateEngineHours(id, hours, "user");
  redirect("/engines");
}

export async function saveInterval(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"));
  const values = {
    engineId: str(form.get("engineId"))!,
    item: str(form.get("item")) ?? "Service",
    everyHours: num(form.get("everyHours")),
    everyMonths: int(form.get("everyMonths")),
    lastHours: num(form.get("lastHours")),
    lastDate: str(form.get("lastDate")),
  };
  if (id) await db.update(serviceIntervals).set(values).where(eq(serviceIntervals.id, id));
  else await db.insert(serviceIntervals).values(values);
  redirect("/engines");
}

export async function deleteInterval(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"));
  if (id) await db.delete(serviceIntervals).where(eq(serviceIntervals.id, id));
  redirect("/engines");
}
