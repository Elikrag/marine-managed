"use server";
import { redirect } from "next/navigation";
import { db, boats } from "@/db";
import { requireAuth } from "@/lib/auth";
import { getBoat } from "@/lib/data";
import { int, num, str } from "@/lib/format";

export async function createBoat(form: FormData) {
  await requireAuth();
  if (await getBoat()) redirect("/");
  await db.insert(boats).values({
    name: str(form.get("name")) ?? "My boat",
    year: int(form.get("year")),
    make: str(form.get("make")),
    model: str(form.get("model")),
    lengthFt: num(form.get("lengthFt")),
    hin: str(form.get("hin")),
  });
  redirect("/");
}
