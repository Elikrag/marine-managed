import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db, pendingWrites, type ApiKey } from "@/db";
import {
  getBoat, getEngines, getIntervalStatuses, getSystems, getTrailer, getServiceEntries, getServiceEntry,
  getIssues, getIssue, getIssueNotes, getPolicies, getStorage, getCostSummary, getCosts, getDocuments, getDocument,
  getSetting, logActivity, targetNames,
} from "./data";
import { runWriteTool } from "./writes";
import { daysUntil } from "./format";

const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });
const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const fail = (s: string) => ({ content: [{ type: "text" as const, text: s }], isError: true });

const target = {
  target_type: z.enum(["boat", "engine", "trailer", "system"]).optional().describe("What the entry is about"),
  target_id: z.string().optional().describe("Engine/system/trailer id from get_boat_profile. Omit for the boat itself."),
};

export async function buildContextSummary(): Promise<string> {
  const boat = await getBoat();
  if (!boat) return "No boat profile has been created yet.";
  const [eng, ivs, sys, tr, open, recent, pol, sto, costs] = await Promise.all([
    getEngines(boat.id), getIntervalStatuses(boat.id), getSystems(boat.id), getTrailer(boat.id),
    getIssues(boat.id, { status: ["open", "monitoring", "scheduled"] }), getServiceEntries(boat.id, { limit: 12 }),
    getPolicies(boat.id), getStorage(boat.id), getCostSummary(boat.id),
  ]);
  const name = await targetNames(boat.id);
  const L: string[] = [];
  L.push(`# ${boat.name}`);
  L.push(`${[boat.year, boat.make, boat.model].filter(Boolean).join(" ")} · ${boat.lengthFt ?? "?"} ft · hull: ${boat.hullType ?? "?"} ${boat.hullMaterial ?? ""} · HIN ${boat.hin ?? "?"} · home port ${boat.homePort ?? "?"}`);
  if (boat.registrationExpires) L.push(`Registration ${boat.registrationNo ?? ""} expires ${boat.registrationExpires}`);
  if (boat.notes) L.push(`Notes: ${boat.notes}`);
  L.push("", "## Engines");
  for (const e of eng) {
    L.push(`- [${e.id}] ${[e.year, e.make, e.model].filter(Boolean).join(" ")} · ${e.hp ?? "?"} hp ${e.driveType ?? ""} ${e.fuelType ?? ""} · serial ${e.serial ?? "?"} · ${e.currentHours} hrs (as of ${e.hoursUpdatedAt ?? "?"})${e.prop ? ` · prop ${e.prop}` : ""}${e.gearRatio ? ` · ratio ${e.gearRatio}` : ""}${e.notes ? ` · ${e.notes}` : ""}`);
  }
  const dueIvs = ivs.filter((s) => s.state !== "ok");
  if (dueIvs.length) {
    L.push("", "## Service due / overdue");
    for (const s of dueIvs) {
      const parts: string[] = [];
      if (s.hoursLeft != null) parts.push(s.hoursLeft < 0 ? `overdue by ${-s.hoursLeft} engine hrs` : `${s.hoursLeft} engine hrs left`);
      if (s.daysLeft != null) parts.push(s.daysLeft < 0 ? `overdue by ${-s.daysLeft} days` : `${s.daysLeft} days left`);
      L.push(`- ${s.interval.item} (${s.engine.make} ${s.engine.model}): ${s.state} — ${parts.join(", ")}`);
    }
  }
  L.push("", "## Systems");
  for (const s of sys) L.push(`- [${s.id}] ${s.category}: ${s.name}${s.make || s.model ? ` (${[s.make, s.model].filter(Boolean).join(" ")})` : ""}${s.serial ? ` sn ${s.serial}` : ""}${s.installedOn ? ` installed ${s.installedOn}` : ""}${s.notes ? ` · ${s.notes}` : ""}`);
  if (tr) {
    L.push("", "## Trailer");
    L.push(`[${tr.id}] ${[tr.year, tr.make, tr.model].filter(Boolean).join(" ")} · VIN ${tr.vin ?? "?"} · ${tr.axles ?? "?"} axle · ${tr.capacityLbs ?? "?"} lb · tires ${tr.tireSize ?? "?"} @ ${tr.tirePressure ?? "?"} · brakes ${tr.brakeType ?? "?"} · bearings last ${tr.lastBearingService ?? "?"}${tr.notes ? ` · ${tr.notes}` : ""}`);
  }
  L.push("", `## Open issues (${open.length})`);
  for (const i of open) L.push(`- [${i.id}] (${i.severity}, ${i.status}) ${i.title} — ${name(i.targetType, i.targetId)} · since ${i.firstNoticed ?? "?"}${i.symptoms ? ` · symptoms: ${i.symptoms}` : ""}${i.suspectedCause ? ` · suspected: ${i.suspectedCause}` : ""}`);
  L.push("", "## Recent service");
  for (const s of recent) L.push(`- ${s.date} ${s.kind} · ${name(s.targetType, s.targetId)} · ${s.title}${s.engineHoursAt != null ? ` @ ${s.engineHoursAt} h` : ""}${s.performedBy ? ` · by ${s.performedBy}` : ""}${s.totalCost != null ? ` · $${s.totalCost}` : ""}`);
  L.push("", "## Insurance");
  for (const p of pol) L.push(`- ${p.covers}: ${p.carrier} ${p.policyNo ?? ""} · renews ${p.renews ?? "?"}${p.renews ? ` (${daysUntil(p.renews)} days)` : ""} · premium $${p.premium ?? "?"}/${p.billingPeriod ?? "yr"}${p.coverageSummary ? ` · ${p.coverageSummary}` : ""}`);
  L.push("", "## Storage");
  for (const s of sto) L.push(`- ${s.target} · ${s.kind} · ${s.locationName}${s.seasonStart ? ` · ${s.seasonStart} → ${s.seasonEnd ?? ""}` : ""}${s.cost != null ? ` · $${s.cost}/${s.billingPeriod}` : ""}`);
  L.push("", `## Costs: $${Math.round(costs.ytd)} YTD ${costs.year}, $${Math.round(costs.lifetime)} lifetime`);
  L.push("", "Use list_service_entries, get_issue, search and get_document for detail. Writes: add_issue_note, create_issue, update_issue, add_service_entry, update_engine_hours, add_cost_entry.");
  return L.join("\n");
}

export function createMcpServer(key: ApiKey) {
  const server = new McpServer({ name: "marine-managed", version: "0.1.0" }, {
    instructions:
      "This server is the owner's single source of truth for their boat. Call get_boat_context first to load the boat, engines, systems, open issues and recent service. Use ids from that output for targets. When troubleshooting, write your findings back with add_issue_note (or create_issue for a new problem) so the history is preserved.",
  });

  const read = async (tool: string, summary: string) => logActivity({ actor: "claude", action: "read", tool, summary });

  const write = async (tool: string, args: Record<string, unknown>, summary: string) => {
    if (key.scope !== "read_write") return fail(`This API key is read-only; ${tool} requires a read+write key.`);
    const requireApproval = (await getSetting("mcp_require_approval", "true")) === "true";
    if (requireApproval) {
      const [pw] = await db.insert(pendingWrites).values({ apiKeyId: key.id, tool, args }).returning();
      await logActivity({ actor: "claude", action: "write", tool, summary: `Queued for approval: ${summary}` });
      return text(`Queued for the owner's approval (pending write ${pw.id}). It will be applied once approved in the app. Tell the user to approve it under Settings → Claude.`);
    }
    try {
      const result = await runWriteTool(tool, args);
      return json({ ok: true, result });
    } catch (e) {
      return fail((e as Error).message);
    }
  };

  // ---- reads
  server.registerTool("get_boat_context", {
    title: "Get boat context",
    description: "One-shot summary of everything: boat, engines (with hours and service due), systems inventory, trailer, open issues, recent service, insurance, storage, and cost totals. Call this first.",
    inputSchema: {},
  }, async () => {
    await read("get_boat_context", "get_boat_context");
    return text(await buildContextSummary());
  });

  server.registerTool("get_boat_profile", {
    title: "Get boat profile",
    description: "Full boat record plus engines (with service intervals) and systems inventory, as JSON.",
    inputSchema: {},
  }, async () => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    const [eng, ivs, sys] = await Promise.all([getEngines(boat.id), getIntervalStatuses(boat.id), getSystems(boat.id)]);
    await read("get_boat_profile", "get_boat_profile");
    return json({ boat, engines: eng.map((e) => ({ ...e, intervals: ivs.filter((s) => s.engine.id === e.id).map((s) => ({ interval: s.interval, nextHours: s.nextHours, nextDate: s.nextDate, hoursLeft: s.hoursLeft, daysLeft: s.daysLeft, state: s.state })) })), systems: sys });
  });

  server.registerTool("get_trailer_profile", { title: "Get trailer profile", description: "Trailer record.", inputSchema: {} }, async () => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    await read("get_trailer_profile", "get_trailer_profile");
    return json((await getTrailer(boat.id)) ?? { message: "No trailer on file." });
  });

  server.registerTool("list_service_entries", {
    title: "List service entries",
    description: "Service/repair/upgrade history, newest first. Filter by kind, target, year, text query, or since date.",
    inputSchema: {
      kind: z.enum(["maintenance", "repair", "upgrade", "inspection", "winterize", "commission"]).optional(),
      ...target,
      year: z.string().optional(),
      since: z.string().optional().describe("ISO date, inclusive"),
      query: z.string().optional().describe("Matches title/description"),
      limit: z.number().int().min(1).max(200).optional(),
    },
  }, async (a) => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    const rows = await getServiceEntries(boat.id, { kind: a.kind, targetType: a.target_type, targetId: a.target_id, year: a.year, since: a.since, q: a.query, limit: a.limit ?? 50 });
    const name = await targetNames(boat.id);
    await read("list_service_entries", `list_service_entries ${JSON.stringify(a)}`);
    return json(rows.map((r) => ({ ...r, target: name(r.targetType, r.targetId) })));
  });

  server.registerTool("get_service_entry", { title: "Get service entry", description: "One service entry with parts and description.", inputSchema: { id: z.string() } }, async ({ id }) => {
    const row = await getServiceEntry(id);
    await read("get_service_entry", `get_service_entry ${id}`);
    return row ? json(row) : fail("Not found");
  });

  server.registerTool("list_issues", {
    title: "List issues",
    description: "Known problems. Defaults to unresolved (open, monitoring, scheduled).",
    inputSchema: {
      status: z.enum(["open", "monitoring", "scheduled", "resolved", "wont_fix", "all"]).optional(),
      severity: z.enum(["low", "med", "high", "safety"]).optional(),
      ...target,
    },
  }, async (a) => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    const status = a.status === "all" ? undefined : a.status ?? ["open", "monitoring", "scheduled"];
    const rows = await getIssues(boat.id, { status, severity: a.severity, targetType: a.target_type, targetId: a.target_id });
    const name = await targetNames(boat.id);
    await read("list_issues", `list_issues ${JSON.stringify(a)}`);
    return json(rows.map((r) => ({ ...r, target: name(r.targetType, r.targetId) })));
  });

  server.registerTool("get_issue", { title: "Get issue", description: "Issue with its full notes/diagnosis thread and linked service entries.", inputSchema: { id: z.string() } }, async ({ id }) => {
    const issue = await getIssue(id);
    if (!issue) return fail("Not found");
    const [notes, linked] = await Promise.all([getIssueNotes(id), getServiceEntries(issue.boatId)]);
    const name = await targetNames(issue.boatId);
    await read("get_issue", `get_issue ${issue.title}`);
    return json({ ...issue, target: name(issue.targetType, issue.targetId), notes, linked_service_entries: linked.filter((s) => s.resolvesIssueId === id) });
  });

  server.registerTool("get_insurance", { title: "Get insurance", description: "Insurance policies for boat and trailer, plus registration expiry.", inputSchema: {} }, async () => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    const tr = await getTrailer(boat.id);
    await read("get_insurance", "get_insurance");
    return json({ policies: await getPolicies(boat.id), registration: { boat: { no: boat.registrationNo, expires: boat.registrationExpires }, trailer: tr ? { no: tr.registrationNo, expires: tr.registrationExpires } : null } });
  });

  server.registerTool("get_storage", { title: "Get storage", description: "Where the boat and trailer are kept, by season, with costs.", inputSchema: {} }, async () => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    await read("get_storage", "get_storage");
    return json(await getStorage(boat.id));
  });

  server.registerTool("get_cost_summary", {
    title: "Get cost summary",
    description: "Totals by category, month and year, plus the ledger for one year.",
    inputSchema: { year: z.string().optional().describe("Defaults to current year"), category: z.string().optional() },
  }, async (a) => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    await read("get_cost_summary", `get_cost_summary ${a.year ?? ""}`);
    return json({ summary: await getCostSummary(boat.id, a.year), entries: await getCosts(boat.id, { year: a.year ?? new Date().getFullYear().toString(), category: a.category }) });
  });

  server.registerTool("search", {
    title: "Search",
    description: "Full-text search across service entries, issues (and notes), systems, and document text extracts (manuals, receipts).",
    inputSchema: { query: z.string().min(1) },
  }, async ({ query }) => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    const q = query.toLowerCase();
    const [svc, iss, sys, docs] = await Promise.all([getServiceEntries(boat.id, { q: query }), getIssues(boat.id), getSystems(boat.id), getDocuments(boat.id, { q: query })]);
    const notesByIssue = await Promise.all(iss.map(async (i) => ({ i, notes: await getIssueNotes(i.id) })));
    const issueHits = notesByIssue
      .filter(({ i, notes }) => [i.title, i.symptoms, i.suspectedCause, i.resolution, ...notes.map((n) => n.body)].some((s) => s?.toLowerCase().includes(q)))
      .map(({ i, notes }) => ({ id: i.id, title: i.title, status: i.status, severity: i.severity, matching_notes: notes.filter((n) => n.body.toLowerCase().includes(q)).map((n) => n.body) }));
    const sysHits = sys.filter((s) => [s.name, s.make, s.model, s.notes, s.serial].some((v) => v?.toLowerCase().includes(q)));
    const docHits = docs.map((d) => {
      const t = d.textExtract ?? "";
      const idx = t.toLowerCase().indexOf(q);
      return { id: d.id, title: d.title, kind: d.kind, snippet: idx >= 0 ? t.slice(Math.max(0, idx - 200), idx + 300) : null };
    });
    await read("search", `search "${query}"`);
    return json({ service_entries: svc, issues: issueHits, systems: sysHits, documents: docHits });
  });

  server.registerTool("list_documents", { title: "List documents", description: "Manuals, receipts, photos, policies on file.", inputSchema: { kind: z.string().optional() } }, async (a) => {
    const boat = await getBoat();
    if (!boat) return fail("No boat profile yet.");
    const rows = await getDocuments(boat.id, { kind: a.kind });
    await read("list_documents", "list_documents");
    return json(rows.map(({ textExtract, ...d }) => ({ ...d, has_text: !!textExtract, text_length: textExtract?.length ?? 0 })));
  });

  server.registerTool("get_document", {
    title: "Get document text",
    description: "Extracted text of a document (e.g. a service manual). Use offset/length to page through long manuals.",
    inputSchema: { id: z.string(), offset: z.number().int().min(0).optional(), length: z.number().int().min(100).max(60000).optional() },
  }, async ({ id, offset = 0, length = 20000 }) => {
    const d = await getDocument(id);
    if (!d) return fail("Not found");
    const t = d.textExtract ?? "";
    await read("get_document", `get_document "${d.title}" @${offset}`);
    return json({ id: d.id, title: d.title, kind: d.kind, total_length: t.length, offset, text: t.slice(offset, offset + length) || "(no text extracted for this document)" });
  });

  // ---- writes
  server.registerTool("add_issue_note", {
    title: "Add issue note",
    description: "Append a note to an issue's diagnosis thread. Use this to record findings, hypotheses, and suggested next steps. Author is recorded as 'claude'.",
    inputSchema: { issue_id: z.string(), body: z.string().min(1) },
  }, async (a) => write("add_issue_note", a, `note on issue ${a.issue_id}`));

  server.registerTool("create_issue", {
    title: "Create issue",
    description: "Open a new known issue.",
    inputSchema: {
      title: z.string(),
      severity: z.enum(["low", "med", "high", "safety"]).optional(),
      status: z.enum(["open", "monitoring", "scheduled"]).optional(),
      ...target,
      first_noticed: z.string().optional(),
      symptoms: z.string().optional(),
      suspected_cause: z.string().optional(),
      est_cost: z.string().optional(),
    },
  }, async (a) => write("create_issue", { title: a.title, severity: a.severity, status: a.status, targetType: a.target_type, targetId: a.target_id, firstNoticed: a.first_noticed, symptoms: a.symptoms, suspectedCause: a.suspected_cause, estCost: a.est_cost }, `create issue "${a.title}"`));

  server.registerTool("update_issue", {
    title: "Update issue",
    description: "Change an issue's status, severity, suspected cause, estimated cost, or resolution.",
    inputSchema: {
      id: z.string(),
      status: z.enum(["open", "monitoring", "scheduled", "resolved", "wont_fix"]).optional(),
      severity: z.enum(["low", "med", "high", "safety"]).optional(),
      suspected_cause: z.string().optional(),
      est_cost: z.string().optional(),
      resolution: z.string().optional(),
      resolved_on: z.string().optional(),
    },
  }, async (a) => write("update_issue", { id: a.id, status: a.status, severity: a.severity, suspectedCause: a.suspected_cause, estCost: a.est_cost, resolution: a.resolution, resolvedOn: a.resolved_on }, `update issue ${a.id}`));

  server.registerTool("add_service_entry", {
    title: "Add service entry",
    description: "Log maintenance, a repair, an upgrade or an inspection. A cost entry is created automatically when a cost is given.",
    inputSchema: {
      date: z.string().optional().describe("ISO date, defaults to today"),
      kind: z.enum(["maintenance", "repair", "upgrade", "inspection", "winterize", "commission"]),
      ...target,
      title: z.string(),
      description: z.string().optional(),
      performed_by: z.string().optional().describe("'DIY' or shop name"),
      engine_hours_at: z.number().optional(),
      parts: z.array(z.object({ name: z.string(), partNo: z.string().optional(), qty: z.number().optional(), cost: z.number().optional() })).optional(),
      labor_cost: z.number().optional(),
      total_cost: z.number().optional(),
      resolves_issue_id: z.string().optional().describe("Marks that issue resolved"),
    },
  }, async (a) => write("add_service_entry", { date: a.date, kind: a.kind, targetType: a.target_type, targetId: a.target_id, title: a.title, description: a.description, performedBy: a.performed_by, engineHoursAt: a.engine_hours_at, parts: a.parts, laborCost: a.labor_cost, totalCost: a.total_cost, resolvesIssueId: a.resolves_issue_id }, `service "${a.title}"`));

  server.registerTool("update_engine_hours", {
    title: "Update engine hours",
    description: "Set an engine's current hour-meter reading.",
    inputSchema: { engine_id: z.string(), hours: z.number().min(0) },
  }, async (a) => write("update_engine_hours", a, `engine hours → ${a.hours}`));

  server.registerTool("add_cost_entry", {
    title: "Add cost entry",
    description: "Record a cost not tied to a service entry (fuel, registration, misc).",
    inputSchema: {
      date: z.string().optional(),
      category: z.enum(["service", "parts", "fuel", "insurance", "storage", "registration", "upgrade", "other"]),
      amount: z.number(),
      vendor: z.string().optional(),
      note: z.string().optional(),
    },
  }, async (a) => write("add_cost_entry", a, `cost ${a.category} $${a.amount}`));

  // ---- resources
  server.registerResource("boat-context", "boat://context", { title: "Boat context", description: "Condensed summary of the whole boat", mimeType: "text/markdown" }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/markdown", text: await buildContextSummary() }],
  }));

  return server;
}
