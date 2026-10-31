import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const now = () =>
  text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`);

export const boats = sqliteTable("boats", {
  id: id(),
  name: text("name").notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  lengthFt: real("length_ft"),
  beamFt: real("beam_ft"),
  hullType: text("hull_type"),
  hullMaterial: text("hull_material"),
  hin: text("hin"),
  registrationNo: text("registration_no"),
  registrationExpires: text("registration_expires"),
  homePort: text("home_port"),
  purchaseDate: text("purchase_date"),
  purchasePrice: real("purchase_price"),
  notes: text("notes"),
  createdAt: now(),
});

export const engines = sqliteTable("engines", {
  id: id(),
  boatId: text("boat_id").notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  serial: text("serial"),
  hp: integer("hp"),
  fuelType: text("fuel_type"),
  driveType: text("drive_type"),
  currentHours: real("current_hours").notNull().default(0),
  hoursUpdatedAt: text("hours_updated_at"),
  prop: text("prop"),
  gearRatio: text("gear_ratio"),
  notes: text("notes"),
  createdAt: now(),
});

export const serviceIntervals = sqliteTable("service_intervals", {
  id: id(),
  engineId: text("engine_id").notNull(),
  item: text("item").notNull(),
  everyHours: real("every_hours"),
  everyMonths: integer("every_months"),
  lastHours: real("last_hours"),
  lastDate: text("last_date"),
});

export const systems = sqliteTable("systems", {
  id: id(),
  boatId: text("boat_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  make: text("make"),
  model: text("model"),
  serial: text("serial"),
  installedOn: text("installed_on"),
  notes: text("notes"),
  createdAt: now(),
});

export const trailers = sqliteTable("trailers", {
  id: id(),
  boatId: text("boat_id").notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  vin: text("vin"),
  axles: integer("axles"),
  capacityLbs: integer("capacity_lbs"),
  tireSize: text("tire_size"),
  tirePressure: text("tire_pressure"),
  brakeType: text("brake_type"),
  registrationNo: text("registration_no"),
  registrationExpires: text("registration_expires"),
  lastBearingService: text("last_bearing_service"),
  notes: text("notes"),
  createdAt: now(),
});

export const serviceEntries = sqliteTable("service_entries", {
  id: id(),
  boatId: text("boat_id").notNull(),
  date: text("date").notNull(),
  kind: text("kind").notNull(), // maintenance|repair|upgrade|inspection|winterize|commission
  targetType: text("target_type").notNull(), // boat|engine|trailer|system
  targetId: text("target_id"),
  title: text("title").notNull(),
  description: text("description"),
  performedBy: text("performed_by"),
  engineHoursAt: real("engine_hours_at"),
  parts: text("parts", { mode: "json" }).$type<Part[]>(),
  laborCost: real("labor_cost"),
  totalCost: real("total_cost"),
  resolvesIssueId: text("resolves_issue_id"),
  source: text("source").notNull().default("manual"), // manual|mcp
  createdAt: now(),
});

export type Part = { name: string; partNo?: string; qty?: number; cost?: number };

export const issues = sqliteTable("issues", {
  id: id(),
  boatId: text("boat_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"), // open|monitoring|scheduled|resolved|wont_fix
  severity: text("severity").notNull().default("med"), // low|med|high|safety
  targetType: text("target_type").notNull().default("boat"),
  targetId: text("target_id"),
  firstNoticed: text("first_noticed"),
  symptoms: text("symptoms"),
  suspectedCause: text("suspected_cause"),
  estCost: text("est_cost"),
  resolvedOn: text("resolved_on"),
  resolution: text("resolution"),
  createdAt: now(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const issueNotes = sqliteTable("issue_notes", {
  id: id(),
  issueId: text("issue_id").notNull(),
  author: text("author").notNull().default("user"), // user|claude
  body: text("body").notNull(),
  createdAt: now(),
});

export const insurancePolicies = sqliteTable("insurance_policies", {
  id: id(),
  boatId: text("boat_id").notNull(),
  covers: text("covers").notNull().default("boat"), // boat|trailer|both
  carrier: text("carrier").notNull(),
  policyNo: text("policy_no"),
  agentContact: text("agent_contact"),
  coverageSummary: text("coverage_summary"),
  hullValue: real("hull_value"),
  liabilityLimit: real("liability_limit"),
  deductible: real("deductible"),
  premium: real("premium"),
  billingPeriod: text("billing_period").default("year"),
  starts: text("starts"),
  renews: text("renews"),
  createdAt: now(),
});

export const storage = sqliteTable("storage", {
  id: id(),
  boatId: text("boat_id").notNull(),
  target: text("target").notNull().default("boat"), // boat|trailer|both
  kind: text("kind").notNull(), // slip|mooring|dry_stack|yard|driveway|garage|other
  locationName: text("location_name").notNull(),
  address: text("address"),
  contact: text("contact"),
  cost: real("cost"),
  billingPeriod: text("billing_period").default("season"),
  seasonStart: text("season_start"),
  seasonEnd: text("season_end"),
  notes: text("notes"),
  createdAt: now(),
});

export const costEntries = sqliteTable("cost_entries", {
  id: id(),
  boatId: text("boat_id").notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(), // service|parts|fuel|insurance|storage|registration|upgrade|other
  amount: real("amount").notNull(),
  vendor: text("vendor"),
  note: text("note"),
  linkedType: text("linked_type"), // service_entry|policy|storage|manual
  linkedId: text("linked_id"),
  source: text("source").notNull().default("manual"),
  createdAt: now(),
});

export const documents = sqliteTable("documents", {
  id: id(),
  boatId: text("boat_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("other"), // manual|receipt|photo|policy|registration|other
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  textExtract: text("text_extract"),
  attachedType: text("attached_type"),
  attachedId: text("attached_id"),
  createdAt: now(),
});

export const apiKeys = sqliteTable("api_keys", {
  id: id(),
  label: text("label").notNull(),
  keyHash: text("key_hash").notNull(),
  prefix: text("prefix").notNull(),
  scope: text("scope").notNull().default("read"), // read|read_write
  createdAt: now(),
  lastUsedAt: text("last_used_at"),
  revokedAt: text("revoked_at"),
});

export const pendingWrites = sqliteTable("pending_writes", {
  id: id(),
  apiKeyId: text("api_key_id"),
  tool: text("tool").notNull(),
  args: text("args", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  status: text("status").notNull().default("pending"), // pending|approved|rejected
  result: text("result"),
  createdAt: now(),
  resolvedAt: text("resolved_at"),
});

export const activityLog = sqliteTable("activity_log", {
  id: id(),
  at: text("at")
    .notNull()
    .default(sql`(datetime('now'))`),
  actor: text("actor").notNull(), // user|claude
  action: text("action").notNull(), // read|write
  tool: text("tool"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Boat = typeof boats.$inferSelect;
export type Engine = typeof engines.$inferSelect;
export type ServiceInterval = typeof serviceIntervals.$inferSelect;
export type System = typeof systems.$inferSelect;
export type Trailer = typeof trailers.$inferSelect;
export type ServiceEntry = typeof serviceEntries.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type IssueNote = typeof issueNotes.$inferSelect;
export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type Storage = typeof storage.$inferSelect;
export type CostEntry = typeof costEntries.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type PendingWrite = typeof pendingWrites.$inferSelect;
export type Activity = typeof activityLog.$inferSelect;
