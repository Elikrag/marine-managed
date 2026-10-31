"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, boats, trailers } from "@/db";
import { requireAuth } from "@/lib/auth";
import { getTrailer, logActivity, requireBoat } from "@/lib/data";
import { int, num, str } from "@/lib/format";

export async function saveBoat(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  await db
    .update(boats)
    .set({
      name: str(form.get("name")) ?? boat.name,
      make: str(form.get("make")),
      model: str(form.get("model")),
      year: int(form.get("year")),
      lengthFt: num(form.get("lengthFt")),
      beamFt: num(form.get("beamFt")),
      hullType: str(form.get("hullType")),
      hullMaterial: str(form.get("hullMaterial")),
      hin: str(form.get("hin")),
      registrationNo: str(form.get("registrationNo")),
      registrationExpires: str(form.get("registrationExpires")),
      homePort: str(form.get("homePort")),
      purchaseDate: str(form.get("purchaseDate")),
      purchasePrice: num(form.get("purchasePrice")),
      notes: str(form.get("notes")),
    })
    .where(eq(boats.id, boat.id));
  await logActivity({ actor: "user", action: "write", entityType: "boat", entityId: boat.id, summary: "Boat profile updated" });
  redirect("/boat");
}

export async function saveTrailer(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  const existing = await getTrailer(boat.id);
  const values = {
    boatId: boat.id,
    make: str(form.get("make")),
    model: str(form.get("model")),
    year: int(form.get("year")),
    vin: str(form.get("vin")),
    axles: int(form.get("axles")),
    capacityLbs: int(form.get("capacityLbs")),
    tireSize: str(form.get("tireSize")),
    tirePressure: str(form.get("tirePressure")),
    brakeType: str(form.get("brakeType")),
    registrationNo: str(form.get("registrationNo")),
    registrationExpires: str(form.get("registrationExpires")),
    lastBearingService: str(form.get("lastBearingService")),
    notes: str(form.get("notes")),
  };
  if (existing) await db.update(trailers).set(values).where(eq(trailers.id, existing.id));
  else await db.insert(trailers).values(values);
  await logActivity({ actor: "user", action: "write", entityType: "trailer", summary: "Trailer profile updated" });
  redirect("/trailer");
}

export async function deleteTrailer() {
  await requireAuth();
  const boat = await requireBoat();
  await db.delete(trailers).where(eq(trailers.boatId, boat.id));
  redirect("/trailer");
}
