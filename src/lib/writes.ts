/**
 * Write operations shared by the UI (server actions) and the MCP server.
 * Each takes plain data and an actor, logs activity, and returns the created/updated row.
 */
import { eq, sql } from "drizzle-orm";
import { db, serviceEntries, issues, issueNotes, engines, costEntries, type Part } from "@/db";
import { logActivity, requireBoat } from "./data";
import { today } from "./format";

type Actor = "user" | "claude";

export type ServiceEntryInput = {
  date?: string;
  kind: string;
  targetType?: string;
  targetId?: string | null;
  title: string;
  description?: string | null;
  performedBy?: string | null;
  engineHoursAt?: number | null;
  parts?: Part[] | null;
  laborCost?: number | null;
  totalCost?: number | null;
  resolvesIssueId?: string | null;
  addCostEntry?: boolean;
};

export async function addServiceEntry(input: ServiceEntryInput, actor: Actor) {
  const boat = await requireBoat();
  const partsTotal = (input.parts ?? []).reduce((s, p) => s + (p.cost ?? 0) * (p.qty ?? 1), 0);
  const total = input.totalCost ?? (partsTotal || input.laborCost ? partsTotal + (input.laborCost ?? 0) : null);
  const [row] = await db
    .insert(serviceEntries)
    .values({
      boatId: boat.id,
      date: input.date ?? today(),
      kind: input.kind,
      targetType: input.targetType ?? "boat",
      targetId: input.targetId ?? null,
      title: input.title,
      description: input.description ?? null,
      performedBy: input.performedBy ?? null,
      engineHoursAt: input.engineHoursAt ?? null,
      parts: input.parts ?? null,
      laborCost: input.laborCost ?? null,
      totalCost: total,
      resolvesIssueId: input.resolvesIssueId ?? null,
      source: actor === "claude" ? "mcp" : "manual",
    })
    .returning();
  if ((input.addCostEntry ?? true) && total != null && total > 0) {
    await db.insert(costEntries).values({
      boatId: boat.id,
      date: row.date,
      category: input.kind === "upgrade" ? "upgrade" : input.performedBy && input.performedBy.toLowerCase() !== "diy" ? "service" : "parts",
      amount: total,
      vendor: input.performedBy ?? null,
      note: input.title,
      linkedType: "service_entry",
      linkedId: row.id,
      source: actor === "claude" ? "mcp" : "manual",
    });
  }
  if (input.resolvesIssueId) {
    await db
      .update(issues)
      .set({ status: "resolved", resolvedOn: row.date, updatedAt: sql`(datetime('now'))` })
      .where(eq(issues.id, input.resolvesIssueId));
  }
  if (input.engineHoursAt != null && input.targetType === "engine" && input.targetId) {
    const [e] = await db.select().from(engines).where(eq(engines.id, input.targetId));
    if (e && input.engineHoursAt > e.currentHours) {
      await db.update(engines).set({ currentHours: input.engineHoursAt, hoursUpdatedAt: row.date }).where(eq(engines.id, e.id));
    }
  }
  await logActivity({ actor, action: "write", tool: actor === "claude" ? "add_service_entry" : undefined, entityType: "service_entry", entityId: row.id, summary: `Service: ${row.title}` });
  return row;
}

export type IssueInput = {
  title: string;
  status?: string;
  severity?: string;
  targetType?: string;
  targetId?: string | null;
  firstNoticed?: string | null;
  symptoms?: string | null;
  suspectedCause?: string | null;
  estCost?: string | null;
};

export async function createIssue(input: IssueInput, actor: Actor) {
  const boat = await requireBoat();
  const [row] = await db
    .insert(issues)
    .values({
      boatId: boat.id,
      title: input.title,
      status: input.status ?? "open",
      severity: input.severity ?? "med",
      targetType: input.targetType ?? "boat",
      targetId: input.targetId ?? null,
      firstNoticed: input.firstNoticed ?? today(),
      symptoms: input.symptoms ?? null,
      suspectedCause: input.suspectedCause ?? null,
      estCost: input.estCost ?? null,
    })
    .returning();
  await logActivity({ actor, action: "write", tool: actor === "claude" ? "create_issue" : undefined, entityType: "issue", entityId: row.id, summary: `Issue opened: ${row.title}` });
  return row;
}

export async function updateIssue(id: string, patch: Partial<IssueInput> & { resolvedOn?: string | null; resolution?: string | null }, actor: Actor) {
  const set: Record<string, unknown> = { updatedAt: sql`(datetime('now'))` };
  for (const k of ["title", "status", "severity", "targetType", "targetId", "firstNoticed", "symptoms", "suspectedCause", "estCost", "resolvedOn", "resolution"] as const) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  if (patch.status === "resolved" && patch.resolvedOn === undefined) set.resolvedOn = today();
  const [row] = await db.update(issues).set(set).where(eq(issues.id, id)).returning();
  if (!row) throw new Error("Issue not found");
  const changed = Object.keys(set).filter((k) => k !== "updatedAt").join(", ");
  await logActivity({ actor, action: "write", tool: actor === "claude" ? "update_issue" : undefined, entityType: "issue", entityId: id, summary: `Issue updated (${changed}): ${row.title}` });
  return row;
}

export async function addIssueNote(issueId: string, body: string, actor: Actor) {
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) throw new Error("Issue not found");
  const [row] = await db.insert(issueNotes).values({ issueId, author: actor, body }).returning();
  await db.update(issues).set({ updatedAt: sql`(datetime('now'))` }).where(eq(issues.id, issueId));
  await logActivity({ actor, action: "write", tool: actor === "claude" ? "add_issue_note" : undefined, entityType: "issue", entityId: issueId, summary: `Note on "${issue.title}"` });
  return row;
}

export async function updateEngineHours(engineId: string, hours: number, actor: Actor) {
  const [row] = await db.update(engines).set({ currentHours: hours, hoursUpdatedAt: today() }).where(eq(engines.id, engineId)).returning();
  if (!row) throw new Error("Engine not found");
  await logActivity({ actor, action: "write", tool: actor === "claude" ? "update_engine_hours" : undefined, entityType: "engine", entityId: engineId, summary: `Engine hours → ${hours}` });
  return row;
}

export type CostInput = { date?: string; category: string; amount: number; vendor?: string | null; note?: string | null };
export async function addCostEntry(input: CostInput, actor: Actor) {
  const boat = await requireBoat();
  const [row] = await db
    .insert(costEntries)
    .values({
      boatId: boat.id,
      date: input.date ?? today(),
      category: input.category,
      amount: input.amount,
      vendor: input.vendor ?? null,
      note: input.note ?? null,
      linkedType: "manual",
      source: actor === "claude" ? "mcp" : "manual",
    })
    .returning();
  await logActivity({ actor, action: "write", tool: actor === "claude" ? "add_cost_entry" : undefined, entityType: "cost_entry", entityId: row.id, summary: `Cost: ${row.category} ${row.amount}` });
  return row;
}

/** Dispatch a named MCP write tool. Used both live and when approving a queued write. */
export async function runWriteTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const a = args as never;
  switch (tool) {
    case "add_service_entry":
      return addServiceEntry(a, "claude");
    case "create_issue":
      return createIssue(a, "claude");
    case "update_issue": {
      const { id, ...patch } = args as { id: string } & Partial<IssueInput>;
      return updateIssue(id, patch, "claude");
    }
    case "add_issue_note": {
      const { issue_id, body } = args as { issue_id: string; body: string };
      return addIssueNote(issue_id, body, "claude");
    }
    case "update_engine_hours": {
      const { engine_id, hours } = args as { engine_id: string; hours: number };
      return updateEngineHours(engine_id, hours, "claude");
    }
    case "add_cost_entry":
      return addCostEntry(a, "claude");
    default:
      throw new Error(`Unknown write tool: ${tool}`);
  }
}
