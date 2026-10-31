import { and, asc, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import {
  db, boats, engines, serviceIntervals, systems, trailers, serviceEntries, issues, issueNotes,
  insurancePolicies, storage, costEntries, documents, apiKeys, pendingWrites, activityLog, settings,
  type Engine, type ServiceInterval,
} from "@/db";
import { daysUntil } from "./format";

export async function getBoat() {
  const [b] = await db.select().from(boats).orderBy(asc(boats.createdAt)).limit(1);
  return b ?? null;
}

export async function requireBoat() {
  const b = await getBoat();
  if (!b) throw new Error("No boat profile yet");
  return b;
}

export async function getEngines(boatId: string) {
  return db.select().from(engines).where(eq(engines.boatId, boatId)).orderBy(asc(engines.createdAt));
}
export async function getEngine(id: string) {
  const [e] = await db.select().from(engines).where(eq(engines.id, id));
  return e ?? null;
}
export async function getIntervals(engineIds: string[]) {
  if (!engineIds.length) return [];
  return db.select().from(serviceIntervals).where(inArray(serviceIntervals.engineId, engineIds)).orderBy(asc(serviceIntervals.item));
}

export type IntervalStatus = {
  interval: ServiceInterval;
  engine: Engine;
  nextHours: number | null;
  nextDate: string | null;
  hoursLeft: number | null;
  daysLeft: number | null;
  state: "ok" | "due" | "overdue" | "unknown";
};

export function intervalStatus(iv: ServiceInterval, engine: Engine): IntervalStatus {
  const nextHours = iv.everyHours != null && iv.lastHours != null ? iv.lastHours + iv.everyHours : null;
  let nextDate: string | null = null;
  if (iv.everyMonths != null && iv.lastDate) {
    const d = new Date(iv.lastDate + "T00:00:00");
    d.setMonth(d.getMonth() + iv.everyMonths);
    nextDate = d.toISOString().slice(0, 10);
  }
  const hoursLeft = nextHours != null ? nextHours - engine.currentHours : null;
  const daysLeft = daysUntil(nextDate);
  let state: IntervalStatus["state"] = "unknown";
  if (hoursLeft != null || daysLeft != null) {
    const over = (hoursLeft != null && hoursLeft < 0) || (daysLeft != null && daysLeft < 0);
    const due = (hoursLeft != null && hoursLeft <= 15) || (daysLeft != null && daysLeft <= 30);
    state = over ? "overdue" : due ? "due" : "ok";
  }
  return { interval: iv, engine, nextHours, nextDate, hoursLeft, daysLeft, state };
}

export async function getIntervalStatuses(boatId: string) {
  const eng = await getEngines(boatId);
  const ivs = await getIntervals(eng.map((e) => e.id));
  return ivs.map((iv) => intervalStatus(iv, eng.find((e) => e.id === iv.engineId)!));
}

export async function getSystems(boatId: string) {
  return db.select().from(systems).where(eq(systems.boatId, boatId)).orderBy(asc(systems.category), asc(systems.name));
}
export async function getSystem(id: string) {
  const [s] = await db.select().from(systems).where(eq(systems.id, id));
  return s ?? null;
}

export async function getTrailer(boatId: string) {
  const [t] = await db.select().from(trailers).where(eq(trailers.boatId, boatId)).limit(1);
  return t ?? null;
}

export type ServiceFilter = { kind?: string; targetType?: string; targetId?: string; year?: string; q?: string; since?: string; limit?: number };
export async function getServiceEntries(boatId: string, f: ServiceFilter = {}) {
  const conds = [eq(serviceEntries.boatId, boatId)];
  if (f.kind) conds.push(eq(serviceEntries.kind, f.kind));
  if (f.targetType) conds.push(eq(serviceEntries.targetType, f.targetType));
  if (f.targetId) conds.push(eq(serviceEntries.targetId, f.targetId));
  if (f.year) conds.push(like(serviceEntries.date, `${f.year}%`));
  if (f.since) conds.push(gte(serviceEntries.date, f.since));
  if (f.q) conds.push(or(like(serviceEntries.title, `%${f.q}%`), like(serviceEntries.description, `%${f.q}%`))!);
  const q = db.select().from(serviceEntries).where(and(...conds)).orderBy(desc(serviceEntries.date), desc(serviceEntries.createdAt));
  return f.limit ? q.limit(f.limit) : q;
}
export async function getServiceEntry(id: string) {
  const [e] = await db.select().from(serviceEntries).where(eq(serviceEntries.id, id));
  return e ?? null;
}

export async function getIssues(boatId: string, f: { status?: string | string[]; severity?: string; targetType?: string; targetId?: string } = {}) {
  const conds = [eq(issues.boatId, boatId)];
  if (f.status) conds.push(Array.isArray(f.status) ? inArray(issues.status, f.status) : eq(issues.status, f.status));
  if (f.severity) conds.push(eq(issues.severity, f.severity));
  if (f.targetType) conds.push(eq(issues.targetType, f.targetType));
  if (f.targetId) conds.push(eq(issues.targetId, f.targetId));
  return db.select().from(issues).where(and(...conds)).orderBy(desc(issues.updatedAt));
}
export async function getIssue(id: string) {
  const [i] = await db.select().from(issues).where(eq(issues.id, id));
  return i ?? null;
}
export async function getIssueNotes(issueId: string) {
  return db.select().from(issueNotes).where(eq(issueNotes.issueId, issueId)).orderBy(asc(issueNotes.createdAt));
}
export async function getNoteCounts(issueIds: string[]) {
  if (!issueIds.length) return new Map<string, { n: number; claude: number }>();
  const rows = await db
    .select({ issueId: issueNotes.issueId, n: sql<number>`count(*)`, claude: sql<number>`sum(case when ${issueNotes.author}='claude' then 1 else 0 end)` })
    .from(issueNotes)
    .where(inArray(issueNotes.issueId, issueIds))
    .groupBy(issueNotes.issueId);
  return new Map(rows.map((r) => [r.issueId, { n: Number(r.n), claude: Number(r.claude) }]));
}

export async function getPolicies(boatId: string) {
  return db.select().from(insurancePolicies).where(eq(insurancePolicies.boatId, boatId)).orderBy(asc(insurancePolicies.renews));
}
export async function getStorage(boatId: string) {
  return db.select().from(storage).where(eq(storage.boatId, boatId)).orderBy(desc(storage.seasonStart));
}

export async function getCosts(boatId: string, f: { year?: string; category?: string } = {}) {
  const conds = [eq(costEntries.boatId, boatId)];
  if (f.year) conds.push(like(costEntries.date, `${f.year}%`));
  if (f.category) conds.push(eq(costEntries.category, f.category));
  return db.select().from(costEntries).where(and(...conds)).orderBy(desc(costEntries.date));
}
export async function getCostSummary(boatId: string, year?: string) {
  const all = await getCosts(boatId);
  const y = year ?? new Date().getFullYear().toString();
  const ytd = all.filter((c) => c.date.startsWith(y));
  const byCat = new Map<string, number>();
  for (const c of ytd) byCat.set(c.category, (byCat.get(c.category) ?? 0) + c.amount);
  const byMonth = Array.from({ length: 12 }, (_, i) => ytd.filter((c) => c.date.slice(5, 7) === String(i + 1).padStart(2, "0")).reduce((s, c) => s + c.amount, 0));
  const byYear = new Map<string, number>();
  for (const c of all) byYear.set(c.date.slice(0, 4), (byYear.get(c.date.slice(0, 4)) ?? 0) + c.amount);
  return {
    year: y,
    ytd: ytd.reduce((s, c) => s + c.amount, 0),
    lifetime: all.reduce((s, c) => s + c.amount, 0),
    byCategory: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
    byMonth,
    byYear: [...byYear.entries()].sort(),
  };
}

export async function getDocuments(boatId: string, f: { kind?: string; attachedType?: string; attachedId?: string; q?: string } = {}) {
  const conds = [eq(documents.boatId, boatId)];
  if (f.kind) conds.push(eq(documents.kind, f.kind));
  if (f.attachedType) conds.push(eq(documents.attachedType, f.attachedType));
  if (f.attachedId) conds.push(eq(documents.attachedId, f.attachedId));
  if (f.q) conds.push(or(like(documents.title, `%${f.q}%`), like(documents.textExtract, `%${f.q}%`))!);
  return db.select().from(documents).where(and(...conds)).orderBy(desc(documents.createdAt));
}
export async function getDocument(id: string) {
  const [d] = await db.select().from(documents).where(eq(documents.id, id));
  return d ?? null;
}

export async function getApiKeys() {
  return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
}
export async function getPendingWrites(status = "pending") {
  return db.select().from(pendingWrites).where(eq(pendingWrites.status, status)).orderBy(desc(pendingWrites.createdAt));
}
export async function countPending() {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(pendingWrites).where(eq(pendingWrites.status, "pending"));
  return Number(r?.n ?? 0);
}
export async function getActivity(limit = 50) {
  return db.select().from(activityLog).orderBy(desc(activityLog.at)).limit(limit);
}
export async function logActivity(a: { actor: "user" | "claude"; action: "read" | "write"; tool?: string; entityType?: string; entityId?: string; summary: string }) {
  await db.insert(activityLog).values(a);
}

export async function getSetting(key: string, fallback: string) {
  const [r] = await db.select().from(settings).where(eq(settings.key, key));
  return r?.value ?? fallback;
}
export async function setSetting(key: string, value: string) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

/** Human-readable name for a service/issue target. */
export async function targetNames(boatId: string) {
  const [b, eng, sys, tr] = await Promise.all([getBoat(), getEngines(boatId), getSystems(boatId), getTrailer(boatId)]);
  const map = new Map<string, string>();
  if (b) map.set("boat:", b.name);
  for (const e of eng) map.set(`engine:${e.id}`, [e.make, e.model].filter(Boolean).join(" ") || "Engine");
  for (const s of sys) map.set(`system:${s.id}`, s.name);
  if (tr) map.set(`trailer:${tr.id}`, [tr.make, tr.model].filter(Boolean).join(" ") || "Trailer");
  map.set("trailer:", "Trailer");
  return (type: string, id: string | null) => map.get(`${type}:${id ?? ""}`) ?? map.get(`${type}:`) ?? type;
}

export type TargetOption = { value: string; label: string };
export async function targetOptions(boatId: string): Promise<TargetOption[]> {
  const [b, eng, sys, tr] = await Promise.all([getBoat(), getEngines(boatId), getSystems(boatId), getTrailer(boatId)]);
  const out: TargetOption[] = [{ value: "boat:", label: b?.name ?? "Boat" }];
  for (const e of eng) out.push({ value: `engine:${e.id}`, label: `Engine · ${[e.make, e.model].filter(Boolean).join(" ")}` });
  if (tr) out.push({ value: `trailer:${tr.id}`, label: `Trailer · ${[tr.make, tr.model].filter(Boolean).join(" ")}` });
  for (const s of sys) out.push({ value: `system:${s.id}`, label: `${s.category} · ${s.name}` });
  return out;
}
export function splitTarget(v: string | null): { targetType: string; targetId: string | null } {
  if (!v) return { targetType: "boat", targetId: null };
  const [t, id] = v.split(":");
  return { targetType: t || "boat", targetId: id || null };
}
