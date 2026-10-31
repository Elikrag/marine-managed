/**
 * Seeds a sample boat so the app has something to look at. Safe to re-run: skips if a boat exists.
 *   npm run db:seed
 */
import { db, boats, engines, serviceIntervals, systems, trailers, serviceEntries, issues, issueNotes, insurancePolicies, storage, costEntries } from "./index";

async function main() {
  const existing = await db.select().from(boats).limit(1);
  if (existing.length) {
    console.log("boat already exists; not seeding");
    return;
  }
  const [boat] = await db.insert(boats).values({
    name: "Salty Dog", make: "Boston Whaler", model: "230 Outrage", year: 2019, lengthFt: 23, beamFt: 8.5,
    hullType: "Deep-V", hullMaterial: "Fiberglass", hin: "BWCE1234A919", registrationNo: "RI 1234 AB", registrationExpires: "2027-03-31",
    homePort: "Jamestown, RI", purchaseDate: "2022-05-14", purchasePrice: 89500, notes: "Second owner. Bottom painted spring 2024.",
  }).returning();
  const [eng] = await db.insert(engines).values({
    boatId: boat.id, make: "Yamaha", model: "F300", year: 2019, serial: "6CE-L-123456", hp: 300, fuelType: "gas", driveType: "outboard",
    currentHours: 412, hoursUpdatedAt: "2026-10-26", prop: "Saltwater Series II 15¼ × 19 SS", gearRatio: "1.75:1",
  }).returning();
  await db.insert(serviceIntervals).values([
    { engineId: eng.id, item: "Oil + filter", everyHours: 100, lastHours: 400, lastDate: "2026-10-26" },
    { engineId: eng.id, item: "Gear lube", everyHours: 100, lastHours: 300, lastDate: "2026-05-02" },
    { engineId: eng.id, item: "Water pump impeller", everyHours: 200, everyMonths: 24, lastHours: 340, lastDate: "2024-05-10" },
    { engineId: eng.id, item: "Fuel filter", everyHours: 100, lastHours: 400, lastDate: "2026-10-26" },
  ]);
  const sys = await db.insert(systems).values([
    { boatId: boat.id, category: "electrical", name: "House battery bank", make: "Odyssey", model: "2× 31M-PC2150", installedOn: "2023-04-20" },
    { boatId: boat.id, category: "electrical", name: "Start battery", make: "Odyssey", model: "34M-PC1500", installedOn: "2023-04-20" },
    { boatId: boat.id, category: "plumbing", name: "Bilge pump (aft)", make: "Rule", model: "2000 GPH + float switch", installedOn: "2025-09-14", notes: "Discharge to transom thru-hull, no vented loop" },
    { boatId: boat.id, category: "electronics", name: "Chartplotter", make: "Garmin", model: "GPSMAP 943xsv", installedOn: "2022-06-01" },
    { boatId: boat.id, category: "electronics", name: "VHF", make: "Standard Horizon", model: "GX2400", installedOn: "2022-06-01" },
    { boatId: boat.id, category: "steering", name: "Hydraulic steering", make: "SeaStar", model: "1.7", installedOn: "2019-03-01" },
    { boatId: boat.id, category: "fuel", name: "Fuel/water separator", make: "Racor", model: "320R-RAC-01", installedOn: "2019-03-01" },
    { boatId: boat.id, category: "canvas", name: "T-top", make: "Factory", installedOn: "2019-03-01" },
    { boatId: boat.id, category: "safety", name: "EPIRB", make: "ACR", model: "GlobalFix V4", installedOn: "2022-06-01", notes: "Battery due 2027-06" },
  ]).returning();
  const bilge = sys.find((s) => s.name.startsWith("Bilge"))!;
  const racor = sys.find((s) => s.name.startsWith("Fuel/water"))!;
  const [trailer] = await db.insert(trailers).values({
    boatId: boat.id, make: "Venture", model: "VATB-6425", year: 2019, vin: "4XTBT2523KM123456", axles: 2, capacityLbs: 6425, tireSize: "ST225/75R15", tirePressure: "65 psi",
    brakeType: "Hydraulic disc, both axles", registrationNo: "RI TR 5678", registrationExpires: "2027-03-31", lastBearingService: "2026-04-18",
  }).returning();

  const [bilgeIssue] = await db.insert(issues).values({
    boatId: boat.id, title: "Bilge pump cycling every ~4 min", severity: "high", status: "open", targetType: "system", targetId: bilge.id, firstNoticed: "2026-10-18",
    symptoms: "Pump runs ~5 s every 4 min at the dock with a dry bilge. Started after heavy rain.", suspectedCause: "Siphon back through discharge hose, or failed check valve", estCost: "$60–200",
  }).returning();
  await db.insert(issues).values([
    { boatId: boat.id, title: "Trim gauge erratic", severity: "med", status: "monitoring", targetType: "engine", targetId: eng.id, firstNoticed: "2026-10-20", symptoms: "Needle jumps between 1/4 and 3/4 under way; steady at idle." },
    { boatId: boat.id, title: "T-top canvas zipper split", severity: "low", status: "open", targetType: "system", targetId: sys.find((s) => s.name === "T-top")!.id, firstNoticed: "2026-09-01" },
    { boatId: boat.id, title: "Bilge float switch stuck", severity: "high", status: "resolved", targetType: "system", targetId: bilge.id, firstNoticed: "2025-09-10", resolvedOn: "2025-09-14", resolution: "Replaced float switch" },
  ]);
  await db.insert(issueNotes).values([
    { issueId: bilgeIssue.id, author: "user", body: "Noticed after rain. Bilge looks dry when it runs." },
    { issueId: bilgeIssue.id, author: "user", body: "Checked float switch, moves freely. Pump itself seems fine." },
  ]);

  const svc = await db.insert(serviceEntries).values([
    { boatId: boat.id, date: "2026-10-26", kind: "maintenance", targetType: "engine", targetId: eng.id, title: "Oil + filter, 400 h", description: "Yamalube 10W-30 FC-W, 5.3 qt. Filter 69J-13440-04. Drained hot, no metal on magnet.", performedBy: "DIY", engineHoursAt: 400, parts: [{ name: "Yamalube 10W-30", qty: 6, cost: 9 }, { name: "Oil filter", partNo: "69J-13440-04", qty: 1, cost: 19 }, { name: "Drain gasket", qty: 1, cost: 3 }], totalCost: 76 },
    { boatId: boat.id, date: "2026-10-11", kind: "maintenance", targetType: "system", targetId: racor.id, title: "Replace fuel/water separator element", performedBy: "DIY", engineHoursAt: 396, parts: [{ name: "Racor R12T element", qty: 1, cost: 31 }], totalCost: 31 },
    { boatId: boat.id, date: "2025-09-14", kind: "repair", targetType: "system", targetId: bilge.id, title: "Replaced float switch", description: "Old Rule-A-Matic stuck closed. Replaced with Rule 35A. Heat-shrink butt connectors.", performedBy: "DIY", engineHoursAt: 381, parts: [{ name: "Rule 35A float switch", qty: 1, cost: 42 }], totalCost: 42 },
    { boatId: boat.id, date: "2026-05-02", kind: "commission", targetType: "boat", title: "Spring commissioning, bottom paint touch-up", performedBy: "Conanicut Marine", engineHoursAt: 352, laborCost: 980, totalCost: 1240 },
    { boatId: boat.id, date: "2026-04-18", kind: "maintenance", targetType: "trailer", targetId: trailer.id, title: "Bearings repacked, brakes inspected", performedBy: "DIY", parts: [{ name: "Marine grease", qty: 1, cost: 12 }, { name: "Seals", qty: 4, cost: 4 }], totalCost: 28 },
    { boatId: boat.id, date: "2025-11-20", kind: "winterize", targetType: "engine", targetId: eng.id, title: "Fog, stabilize fuel, gear lube", performedBy: "Conanicut Marine", engineHoursAt: 340, totalCost: 410 },
  ]).returning();
  for (const s of svc) {
    if (s.totalCost) await db.insert(costEntries).values({ boatId: boat.id, date: s.date, category: s.performedBy === "DIY" ? "parts" : "service", amount: s.totalCost, vendor: s.performedBy, note: s.title, linkedType: "service_entry", linkedId: s.id });
  }

  const [pol] = await db.insert(insurancePolicies).values({
    boatId: boat.id, covers: "both", carrier: "Progressive", policyNo: "9876-5432-10", agentContact: "J. Rivera · 401-555-0142", coverageSummary: "Agreed hull value, trailer rider $6,000 ACV, towing included",
    hullValue: 85000, liabilityLimit: 500000, deductible: 1000, premium: 1180, billingPeriod: "year", starts: "2025-12-11", renews: "2026-12-11",
  }).returning();
  await db.insert(costEntries).values({ boatId: boat.id, date: "2025-12-11", category: "insurance", amount: 1180, vendor: "Progressive", note: "Annual premium", linkedType: "policy", linkedId: pol.id });

  const sto = await db.insert(storage).values([
    { boatId: boat.id, target: "boat", kind: "slip", locationName: "Conanicut Marina, slip B-14", contact: "office 401-555-0100", cost: 3900, billingPeriod: "season", seasonStart: "2026-05-01", seasonEnd: "2026-10-31" },
    { boatId: boat.id, target: "both", kind: "yard", locationName: "Conanicut Marine yard (shrink-wrapped)", cost: 1450, billingPeriod: "season", seasonStart: "2026-11-01", seasonEnd: "2027-04-30" },
    { boatId: boat.id, target: "trailer", kind: "driveway", locationName: "Home", cost: 0, billingPeriod: "season", seasonStart: "2026-05-01", seasonEnd: "2026-10-31" },
  ]).returning();
  for (const s of sto) if (s.cost) await db.insert(costEntries).values({ boatId: boat.id, date: s.seasonStart!, category: "storage", amount: s.cost, vendor: s.locationName, note: s.kind, linkedType: "storage", linkedId: s.id });

  await db.insert(costEntries).values([
    { boatId: boat.id, date: "2026-10-14", category: "fuel", amount: 96, vendor: "Conanicut fuel dock", note: "38 gal", linkedType: "manual" },
    { boatId: boat.id, date: "2026-08-02", category: "fuel", amount: 210, vendor: "Conanicut fuel dock", note: "82 gal", linkedType: "manual" },
    { boatId: boat.id, date: "2026-06-19", category: "fuel", amount: 180, vendor: "Conanicut fuel dock", note: "71 gal", linkedType: "manual" },
    { boatId: boat.id, date: "2026-03-20", category: "registration", amount: 120, vendor: "RI DEM", note: "Boat + trailer", linkedType: "manual" },
  ]);
  console.log("seeded", boat.name);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
