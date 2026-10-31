"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, insurancePolicies, costEntries } from "@/db";
import { requireAuth } from "@/lib/auth";
import { logActivity, requireBoat } from "@/lib/data";
import { num, str } from "@/lib/format";

export async function savePolicy(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  const id = str(form.get("id"));
  const values = {
    boatId: boat.id,
    covers: str(form.get("covers")) ?? "boat",
    carrier: str(form.get("carrier")) ?? "Carrier",
    policyNo: str(form.get("policyNo")),
    agentContact: str(form.get("agentContact")),
    coverageSummary: str(form.get("coverageSummary")),
    hullValue: num(form.get("hullValue")),
    liabilityLimit: num(form.get("liabilityLimit")),
    deductible: num(form.get("deductible")),
    premium: num(form.get("premium")),
    billingPeriod: str(form.get("billingPeriod")) ?? "year",
    starts: str(form.get("starts")),
    renews: str(form.get("renews")),
  };
  let pid = id;
  if (id) await db.update(insurancePolicies).set(values).where(eq(insurancePolicies.id, id));
  else {
    const [r] = await db.insert(insurancePolicies).values(values).returning();
    pid = r.id;
  }
  // one ledger row per policy term, keyed to the policy
  await db.delete(costEntries).where(eq(costEntries.linkedId, pid!));
  if (values.premium && values.starts) {
    await db.insert(costEntries).values({ boatId: boat.id, date: values.starts, category: "insurance", amount: values.premium, vendor: values.carrier, note: `${values.covers} policy ${values.policyNo ?? ""}`.trim(), linkedType: "policy", linkedId: pid! });
  }
  await logActivity({ actor: "user", action: "write", entityType: "policy", entityId: pid!, summary: `Policy ${id ? "updated" : "added"}: ${values.carrier}` });
  redirect("/insurance");
}

export async function deletePolicy(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.delete(costEntries).where(eq(costEntries.linkedId, id));
  await db.delete(insurancePolicies).where(eq(insurancePolicies.id, id));
  redirect("/insurance");
}
